import { LitElement, html, css } from 'lit';
import { component } from 'haunted';
import { useController } from 'haunted/lib/use-controller.js';
import { useState } from 'haunted';

// Using haunted's component function for hook support
function GameCard({ gameId, image, name, theme, version }) {
  const [hovered, setHovered] = useState(false);

  const handleButtonClick = (e) => {
    e.stopPropagation();
    // This will trigger the mesulo SDK if available
    console.log(`Opening game: ${gameId}`);
    
    // Dispatch custom event for handling
    const event = new CustomEvent('game-card-click', {
      detail: { gameId, name, theme, version },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  };

  return html`
    <div 
      class="game-card"
      data-masulo-game-id="${gameId}"
      data-masulo-tag="true"
      ?data-masulo-theme="${theme}"
      ?data-masulo-version="${version}"
      @mouseenter=${() => setHovered(true)}
      @mouseleave=${() => setHovered(false)}
      style="${hovered ? 'transform: translateY(-5px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);' : ''}"
    >
      <img src="${image}" alt="${name}" class="game-image" loading="lazy" />
      <div class="game-test">${name}</div>
      <button class="button" @click=${handleButtonClick}>See More</button>
    </div>
  `;
}

// Define a custom element that extends LitElement
class GameCardElement extends LitElement {
  static properties = {
    gameId: { type: String, attribute: 'game-id' },
    image: { type: String },
    name: { type: String },
    theme: { type: String },
    version: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .game-card {
      aspect-ratio: 220 / 250;
      width: 100%;
      background-color: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .game-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .game-test {
      text-align: center;
      padding: 10px;
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }

    .button {
      position: absolute;
      bottom: 15px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background-color 0.2s;
    }

    .button:hover {
      background-color: #45a049;
    }
  `;

  constructor() {
    super();
    this.gameId = '';
    this.image = '';
    this.name = '';
    this.theme = '';
    this.version = '';
    this.videoUrl = '';
  }

  render() {
    // Use lit's template with current properties
    return html`
      <div 
        class="game-card"
        data-masulo-game-id="${this.gameId}"
        data-masulo-tag="true"
        ?data-masulo-theme="${this.theme}"
        ?data-masulo-version="${this.version}"
      >
        <img src="${this.image}" alt="${this.name}" class="game-image" loading="lazy" />
        <button 
          class="button" 
          @click=${(e) => this._handleButtonClick(e)}
        >
          See More
        </button>
      </div>
    `;
  }

  _handleButtonClick(e) {
    e.stopPropagation();
    console.log(`Opening game: ${this.gameId}`);
    
    const event = new CustomEvent('game-card-click', {
      detail: { 
        gameId: this.gameId, 
        name: this.name, 
        theme: this.theme, 
        version: this.version 
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Register with SDK
    if (window.mesulo && this.gameId) {
      window.mesulo.registerGameCard(this, this.gameId);
      console.log(`[Game Card] Registered with SDK: ${this.gameId}`);
    }
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Unregister from SDK
    if (window.mesulo && this.gameId) {
      window.mesulo.unregisterGameCard(this.gameId);
      console.log(`[Game Card] Unregistered from SDK: ${this.gameId}`);
    }
  }
  
  /**
   * Update content from SDK
   * Called by SDK when game data is received
   */
  updateContent(imageUrl, videoUrl) {
    console.log(`[Game Card] Updating content for ${this.gameId}:`, { imageUrl, videoUrl });
    
    if (imageUrl) {
      this.image = imageUrl;
    }
    if (videoUrl !== undefined) {
      this.videoUrl = videoUrl;
    }
    this.requestUpdate();
  }
  
  firstUpdated() {
    // Add hover effect using CSS and JavaScript
    const card = this.shadowRoot.querySelector('.game-card');
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  }
}

// Register the custom element
customElements.define('game-card', GameCardElement);

export { GameCardElement };
