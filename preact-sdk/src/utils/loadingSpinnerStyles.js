export function injectLoadingSpinnerStyles() {
  if (document.getElementById('mesulo-loading-spinner-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'mesulo-loading-spinner-styles';
  style.textContent = `
    @keyframes mesulo-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .mesulo-spinner {
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      animation: mesulo-spin 0.8s linear infinite;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .mesulo-spinner.visible {
      opacity: 1;
    }
    
    .mesulo-spinner.stopped {
      animation: none !important;
      animation-play-state: paused !important;
    }
    
    .mesulo-image-fade {
      transition: opacity 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
      will-change: opacity;
      backface-visibility: hidden;
      transform: translateZ(0);
    }
    
    .mesulo-video-fade {
      transition: opacity 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
      will-change: opacity;
      backface-visibility: hidden;
      transform: translateZ(0);
      opacity: 0;
    }
    
    .mesulo-video-fade.active {
      opacity: 1;
    }
    
    video[data-mesulo-id] {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      object-position: center center !important;
      display: block;
      max-width: 100%;
      max-height: 100%;
    }
  `;
  
  document.head.appendChild(style);
}

