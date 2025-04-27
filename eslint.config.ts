import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import stencil from "@stencil/eslint-plugin";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    stencil.configs.flat.recommended,
    {
        files: ["src/**/*.{ts,tsx}"],
    },
    {
        ignores: [
            "www/**/*",
            "node_modules/**/*",
            "dist/**/*",
            "loader/**/*",
            "eslint.config.ts",
            "stencil.config.ts",
        ],
    },
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                projectService: true,
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            }
        }
    },
    {
        rules: {
            "@typescript-eslint/no-unsafe-return": "off",
        }
    }
);