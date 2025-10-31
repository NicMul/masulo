import { MesuloSDK } from '../src/sdk/core.js';

class VideoManager {
  constructor() {
    this.videos = new Map();
    this.currentHovered = null;
    this._createListeners();
  }

  // Detect element underneath overlays safely
  _deepestElementFromPoint(x, y) {
    const seen = new Set();
    let el = document.elementFromPoint(x, y);
    let underneath = null;

    while (el && !seen.has(el)) {
      seen.add(el);

      // Skip interactive elements to avoid breaking clicks
      if (/^(BUTTON|A|INPUT|LABEL|SELECT|TEXTAREA)$/i.test(el.tagName)) {
        return el;
      }

      const prev = el.style.pointerEvents;
      el.style.pointerEvents = 'none';
      underneath = document.elementFromPoint(x, y);
      el.style.pointerEvents = prev;

      // Stop once we reach a <video>
      if (underneath && underneath.tagName === 'VIDEO') {
        return underneath;
      }

      el = underneath;
    }

    return underneath;
  }

  // Handle hover logic globally (desktop)
  _handleHover(x, y) {
    const el = this._deepestElementFromPoint(x, y);
    if (!el) return;

    const video = el.closest('video');
    if (video && this.videos.has(video)) {
      if (this.currentHovered !== video) {
        if (this.currentHovered && !this.currentHovered.paused) {
          this.currentHovered.pause();
        }
        this.currentHovered = video;
        video.play().catch(() => {});
      }
    } else if (this.currentHovered) {
      this.currentHovered.pause();
      this.currentHovered = null;
    }
  }

  // Setup pointer & touch listeners
  _createListeners() {
    // Desktop hover
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return; // skip for touch
      this._handleHover(e.clientX, e.clientY);
    });

    // Touch tap toggle
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      const el = this._deepestElementFromPoint(e.clientX, e.clientY);
      if (!el) return;

      const video = el.closest('video');
      if (video && this.videos.has(video)) {
        if (this.currentHovered && this.currentHovered !== video) {
          this.currentHovered.pause();
        }
        if (video.paused) {
          video.play().catch(() => {});
          this.currentHovered = video;
        } else {
          video.pause();
          this.currentHovered = null;
        }
      } else if (this.currentHovered) {
        this.currentHovered.pause();
        this.currentHovered = null;
      }
    });

    // Optional: auto-pause when scrolling
    window.addEventListener('scroll', () => {
      if (this.currentHovered && !this.currentHovered.paused) {
        this.currentHovered.pause();
        this.currentHovered = null;
      }
    }, { passive: true });
  }

  // Replace <img> with <video>
  replaceImage(img, gameId) {
    const video = document.createElement('video');
    const computedStyles = window.getComputedStyle(img);

    // Copy style as safely as possible
    video.style.cssText = `
      ${img.getAttribute('style') || ''}
      object-fit: ${computedStyles.objectFit || 'cover'};
      pointer-events: auto;
      cursor: pointer;
      display: inline-block;
    `;

    video.className = img.className;

    video.setAttribute('width', img.getAttribute('width') || computedStyles.width);
    video.setAttribute('height', img.getAttribute('height') || computedStyles.height);
    if (img.alt) video.setAttribute('title', img.alt);

    // Video source setup
    video.src = 'https://casino-cdn-45tz9ud.b-cdn.net/videos/theme-sxbadstm0.mp4';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';

    this.videos.set(video, {
      playing: false,
      originalSrc: img.src,
      gameId: gameId
    });

    img.replaceWith(video);
  }
}

// SDK entry point
function init() {
  // Initialize MesuloSDK
  const script = document.currentScript ||
    document.querySelector('script[data-application-key]');

  if (script?.dataset.applicationKey) {
    const mesuloSDK = new MesuloSDK({
      applicationKey: script.dataset.applicationKey
    });
    window.mesulo = mesuloSDK;
  } else {
    console.warn('[Mesulo SDK] No application key found. SDK will not connect to server.');
  }

  // Initialize SimpleVideoSDK and replace images
  const sdk = new VideoManager();

  document.querySelectorAll('img[data-mesulo-game-id]').forEach(img => {
    const gameId = img.getAttribute('data-mesulo-game-id');
    if (gameId) {
      sdk.replaceImage(img, gameId);
    }
  });
}

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { VideoManager };