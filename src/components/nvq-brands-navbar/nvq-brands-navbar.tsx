import { Component, Host, h, Element, State } from '@stencil/core';

@Component({
  tag: 'nvq-brands-navbar',
  styleUrl: 'nvq-brands-navbar.scss',
  shadow: true,
})
export class NvqBrandsNavbar {
  
  @Element() el!: HTMLElement;

  @State() scrollPosition = 0
  @State() largestWidth = 0;
  
  private items: Element[] = [];
  private slot?: Element;
  private slides?: HTMLDivElement;
  private prevButton?: HTMLButtonElement;
  private nextButton?: HTMLButtonElement;

  private updateGridTemplateColumns() {
    if (this.slot != undefined && this.items.length > 0) {
      this.largestWidth = Math.max(
        ...this.items.map(item => (item as HTMLElement).offsetWidth || 0)
      );

      const gridTemplateColumns = `repeat(${this.items.length}, ${this.largestWidth}px)`;
      const slot = this.slot as HTMLSlotElement;
      slot.style.gridTemplateColumns = gridTemplateColumns;
    }
  }

  private updateItemVisibility() {
    if (this.slides && this.items) {
      const containerRect = this.slides.getBoundingClientRect();
      this.items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const isFullyVisible = itemRect.left >= containerRect.left && itemRect.right <= containerRect.right;
        (item as HTMLElement).style.opacity = isFullyVisible ? '1' : '0';
        (item as HTMLElement).style.pointerEvents = isFullyVisible ? 'auto' : 'none';
      });
    }
  }

  private updateButtonVisibility() {
    if (this.slides && this.items && this.prevButton && this.nextButton) {
      const containerRect = this.slides.getBoundingClientRect();
      const allItemsFit = this.items.every(item => {
        const itemRect = item.getBoundingClientRect();
        return itemRect.right <= containerRect.right && itemRect.left >= containerRect.left;
      });

      this.prevButton.style.display = allItemsFit ? 'none' : 'block';
      this.nextButton.style.display = allItemsFit ? 'none' : 'block';
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

  private hasHiddenItemsLeft() {
    if (this.slides && this.items) {
      const containerRect = this.slides.getBoundingClientRect();
      return this.items.some(item => {
        const itemRect = item.getBoundingClientRect();
        return itemRect.right < containerRect.left;
      });
    }
  }

  private hasHiddenItemsRight() {
    if (this.slides && this.items) {
      const containerRect = this.slides.getBoundingClientRect();
      return this.items.some(item => {
        const itemRect = item.getBoundingClientRect();
        return itemRect.left > containerRect.right;
      });
    }
  }

  private handlePreviousClick(): void {
    this.scrollPosition += this.largestWidth;
    (this.slot as HTMLElement).style.left = `${this.scrollPosition}px`;
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.updateItemVisibility();
      }, 100);
      setTimeout(() => {
        this.updateButtonVisibility();
      }, 100);
    });
  }

  private handleNextClick(): void {
    this.scrollPosition -= this.largestWidth;
    (this.slot as HTMLElement).style.left = `${this.scrollPosition}px`;
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.updateItemVisibility();
      }, 100);
      setTimeout(() => {
        this.updateButtonVisibility();
      }, 100);
    });
  }

  render() {
    return (
      <Host>
          <button
            class="prev"
            title="Previous"
            ref={el => this.prevButton = el}
            style={{ display: this.hasHiddenItemsLeft() ? 'block' : 'none' }}
            onClick={() => this.handlePreviousClick()}
          >
            <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 30" width="23" height="38">
              <path d="m17.5 29.3v-28.4l-17.1 14.5c0 0 18.3 15.1 17.1 13.9z"/>
            </svg>
          </button>
            <div ref={el => this.slides = el} class="slides">
              <div class="carousel-inner">
                <slot
                  ref={el => this.slot = el}
                  onSlotchange={() => {this.handleSlotChanged()}}
                />
              </div>
            </div>
          <button
            class="next"
            title="Next"
            ref={el => this.nextButton = el}
            style={{ display: this.hasHiddenItemsRight() ? 'block' : 'none' }}
            onClick={() => this.handleNextClick()}
          >
            <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 28" width="23" height="38">
              <path d="m0.4 0.6v26.7l16.1-13.7c0 0-17.2-14.2-16.1-13z"/>
            </svg>
          </button>
      </Host>
    );
  }
}
