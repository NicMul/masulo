export function injectWrapperStyles() {
  if (document.getElementById('mesulo-wrapper-styles')) return;

  const style = document.createElement('style');
  style.id = 'mesulo-wrapper-styles';
  style.textContent = `
    video[data-mesulo-id] {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      filter: blur(10px);
      z-index: 2;
    }
    
    video[data-mesulo-id].mesulo-video-fade-in {
      transition: opacity 2s ease-in-out, filter 2s ease-in-out;
      opacity: 1;
      filter: blur(0);
    }
    
    .mesulo-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      z-index: 1;
    }
    
    .mesulo-container.mesulo-container-fade-in {
      transition: opacity 1s ease-in-out;
      opacity: 1;
    }
    
    .mesulo-container.mesulo-container-hidden {
      transition: opacity 0s;
      opacity: 0;
    }
    
    .mesulo-base-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }
    
    .mesulo-spinner {
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      opacity: 0;
      z-index: 2;
    }
    
    .mesulo-spinner.mesulo-spinner-active {
      animation: mesulo-spin 1s linear infinite;
    }
    
    .mesulo-spinner.mesulo-spinner-fade-in {
      transition: opacity 1s ease-in-out;
      opacity: 1;
    }
    
    .mesulo-spinner.mesulo-spinner-hidden {
      transition: opacity 0s;
      opacity: 0;
    }
    
    @keyframes mesulo-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  document.head.appendChild(style);
}

