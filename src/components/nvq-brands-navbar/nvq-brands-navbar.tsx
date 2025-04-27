import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'nvq-brands-navbar',
  styleUrl: 'nvq-brands-navbar.scss',
  shadow: true,
})
export class NvqBrandsNavbar {
  render() {
    return (
      <Host>
        <div class="bar">
          <slot></slot>
        </div>
      </Host>
    );
  }
}
