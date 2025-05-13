using System;
using System.Linq;
using Nuke.Common;
using Nuke.Common.CI;
using Nuke.Common.CI.GitHubActions;
using Nuke.Common.Execution;
using Nuke.Common.Git;
using Nuke.Common.IO;
using Nuke.Common.ProjectModel;
using Nuke.Common.Tooling;
using Nuke.Common.Tools.Git;
using Nuke.Common.Tools.GitHub;
using Nuke.Common.Tools.GitVersion;
using Nuke.Common.Tools.Npm;
using Nuke.Common.Utilities;
using Nuke.Common.Utilities.Collections;
using Octokit;
using static Nuke.Common.EnvironmentInfo;
using static Nuke.Common.IO.PathConstruction;
using static Nuke.Common.Tools.Git.GitTasks;
using static Nuke.Common.Tools.Npm.NpmTasks;

[GitHubActions(
    "PR_Validation",
    GitHubActionsImage.UbuntuLatest,
    OnPullRequestBranches = new[] { "main", "develop", "release/*" },
    InvokedTargets = new[] { nameof(Compile) },
    PublishArtifacts = true,
    FetchDepth = 0,
    CacheKeyFiles = new string[] {}
)]
[GitHubActions(
    "Deploy",
    GitHubActionsImage.UbuntuLatest,
    ImportSecrets = new[] { nameof(GitHubToken), "GITHUB_TOKEN", nameof(NpmKey), "NPM_KEY" },
    OnPushBranches = new[] { "main", "release/*" },
    InvokedTargets = new[] { nameof(Deploy) },
    FetchDepth = 0,
    CacheKeyFiles = new string[] {}
)]
class Build : NukeBuild
{
    /// Support plugins are available for:
    ///   - JetBrains ReSharper        https://nuke.build/resharper
    ///   - JetBrains Rider            https://nuke.build/rider
    ///   - Microsoft VisualStudio     https://nuke.build/visualstudio
    ///   - Microsoft VSCode           https://nuke.build/vscode

    public static int Main () => Execute<Build>(x => x.Compile);

    [Parameter("Configuration to build - Default is 'Debug' (local) or 'Release' (server)")]
    readonly Configuration Configuration = IsLocalBuild ? Configuration.Debug : Configuration.Release;

    [Parameter("NPM Token")]
    [Secret]
    readonly string NpmKey;

    [Parameter("GitHub Token")]
    [Secret]
    readonly string GitHubToken;

    [GitRepository] readonly GitRepository GitRepository;
    [GitVersion] readonly GitVersion GitVersion;

    // Directories
    AbsolutePath DistDirectory => RootDirectory / "dist";

    Target Clean => _ => _
        .Before(Restore)
        .Executes(() =>
        {
            DistDirectory.CreateOrCleanDirectory();
        });

    Target Restore => _ => _
        .Executes(() =>
        {
            NpmInstall(s => s
                .SetProcessWorkingDirectory(RootDirectory)
            ); 
        });
    
    Target TagRelease => _ => _
    .OnlyWhenDynamic(() => GitRepository.IsOnMainOrMasterBranch() || GitRepository.IsOnReleaseBranch())
    .OnlyWhenDynamic(() => !string.IsNullOrWhiteSpace(GitHubToken))
    .Executes(() =>
    {
        var version = GitRepository.IsOnMainOrMasterBranch() ? GitVersion.MajorMinorPatch : GitVersion.SemVer;
        Git($"tag v{version}");
        Git($"push origin --tags");
    });

    Target SetVersion => _ => _
    .OnlyWhenDynamic(() => GitRepository.IsOnMainBranch() || GitRepository.IsOnReleaseBranch())
    .Executes(() =>
    {
        var version = GitRepository.IsOnMainBranch() ? GitVersion.MajorMinorPatch : GitVersion.SemVer;
        Serilog.Log.Information($"Setting version to {version}");
        Npm($"version {version} --allow-same-version --git-tag-version false", RootDirectory);
    });

    Target LogVersion => _ => _
        .Before(SetVersion)
        .Executes(() =>
        {
            GitVersionTasks.GitVersion(s => s
                .SetProcessWorkingDirectory(RootDirectory)
                .EnableDiagnostics());
        });

    Target Compile => _ => _
        .DependsOn(Clean)
        .DependsOn(Restore)
        .DependsOn(SetVersion)
        .DependsOn(LogVersion)
        .Executes(() =>
        {
            NpmRun(s => s
                .SetProcessWorkingDirectory(RootDirectory)
                .SetCommand("build"));
        });

    Target Deploy => _ => _
        .DependsOn(Compile)
        .DependsOn(TagRelease)
        .Executes(() => {
            // Github
            var version = GitRepository.IsOnMainOrMasterBranch() ? $"v{GitVersion.MajorMinorPatch}" : $"v{GitVersion.SemVer}";
            var newRelease = new NewRelease(version)
            {
                GenerateReleaseNotes = true,
                Draft = true,
                Name = version,
                TargetCommitish = GitVersion.Sha,
                Prerelease = GitRepository.IsOnReleaseBranch(),
            };
            var client = new GitHubClient(new ProductHeaderValue("Nuke"));
            var tokenAuth = new Credentials(GitHubToken);
            client.Credentials = tokenAuth;
            var release = client.Repository.Release.Create(GitRepository.GetGitHubOwner(), GitRepository.GetGitHubName(), newRelease).Result;
            Serilog.Log.Information($"{release.Name} released!");

            // npm
            var npmrcFile = RootDirectory / ".npmrc";
            npmrcFile.WriteAllText($"//registry.npmjs.org/:_authToken={NpmKey}");
            var tag = GitRepository.IsOnMainOrMasterBranch() ? "latest" : "next";
            Npm($"publish --access public --tag {tag}");
        });
}
