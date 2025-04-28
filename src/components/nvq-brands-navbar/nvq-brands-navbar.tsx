import { Component, Host, h, Element, State } from '@stencil/core';

@Component({
  tag: 'nvq-brands-navbar',
  styleUrl: 'nvq-brands-navbar.scss',
  shadow: true,
})
export class NvqBrandsNavbar {
  
  @Element() el!: HTMLElement;
  @State() currentIndex: number = 0;
  
  private items: Element[] = [];

  private updateGridTemplateColumns() {
    const slidesContainer = this.el.shadowRoot?.querySelector('.slides slot');
    if (slidesContainer && this.items) {
      // Calculate the largest width among the items
      const largestWidth = Math.max(
        ...this.items.map(item => (item as HTMLElement).offsetWidth || 0)
      );

      // Set the grid template columns to use the largest width
      const gridTemplateColumns = this.items.map(() => `${largestWidth}px`).join(' ');
      (slidesContainer as HTMLElement).style.display = 'grid';
      (slidesContainer as HTMLElement).style.gridTemplateColumns = gridTemplateColumns;
      (slidesContainer as HTMLElement).style.justifyContent = 'center';
      (slidesContainer as HTMLElement).style.overflow = 'hidden';
    }
  }

  private updateItemVisibility() {
    const slidesContainer = this.el.shadowRoot?.querySelector('.slides');
    if (slidesContainer && this.items) {
      const containerRect = slidesContainer.getBoundingClientRect();
      this.items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const isFullyVisible = itemRect.left >= containerRect.left && itemRect.right <= containerRect.right;
        (item as HTMLElement).style.opacity = isFullyVisible ? '1' : '0';
        (item as HTMLElement).style.pointerEvents = isFullyVisible ? 'auto' : 'none';
      });
    }
  }

  private updateButtonVisibility() {
    const slidesContainer = this.el.shadowRoot?.querySelector('.slides');
    const prevButton = this.el.shadowRoot?.querySelector('.prev') as HTMLButtonElement;
    const nextButton = this.el.shadowRoot?.querySelector('.next') as HTMLButtonElement;

    if (slidesContainer && this.items && prevButton && nextButton) {
      const containerRect = slidesContainer.getBoundingClientRect();
      const allItemsFit = this.items.every(item => {
        const itemRect = item.getBoundingClientRect();
        return itemRect.right <= containerRect.right && itemRect.left >= containerRect.left;
      });

      prevButton.style.display = allItemsFit ? 'none' : 'block';
      nextButton.style.display = allItemsFit ? 'none' : 'block';
    }
  }

  private handleResize() {
    this.updateItemVisibility();
    this.updateButtonVisibility();
  }

  connectedCallback() {
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
  
  private handleSlotChanged() {
    this.items = this.el.shadowRoot?.querySelector('slot')?.assignedElements() ?? [];
    console.log(this.items);
    this.updateGridTemplateColumns();
    this.updateItemVisibility();
    this.updateButtonVisibility();
  }

  render() {
    return (
      <Host>
          <button class="prev" title="Previous">
            <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 30" width="23" height="38">
              <path d="m17.5 29.3v-28.4l-17.1 14.5c0 0 18.3 15.1 17.1 13.9z"/>
            </svg>
          </button>
          <div class="slides">
            <slot
              onSlotchange={() => {this.handleSlotChanged()}}
            />
          </div>
          <button class="next" title="Next">
            <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 28" width="23" height="38">
              <path d="m0.4 0.6v26.7l16.1-13.7c0 0-17.2-14.2-16.1-13z"/>
            </svg>
          </button>
      </Host>
    );
  }
}
