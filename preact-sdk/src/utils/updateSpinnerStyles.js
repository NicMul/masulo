export function injectUpdateSpinnerStyles() {
  if (document.getElementById('mesulo-update-spinner-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'mesulo-update-spinner-styles';
  style.textContent = `
    @keyframes mesulo-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .mesulo-video-update-spinner {
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(34, 197, 94, 0.3);
      border-top: 2px solid rgba(34, 197, 94, 0.9);
      border-radius: 50%;
      animation: mesulo-spin 0.8s linear infinite;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .mesulo-video-update-spinner.visible {
      opacity: 1;
    }
  `;
  
  document.head.appendChild(style);
}

