export function injectWrapperStyles() {
  if (document.getElementById('mesulo-wrapper-styles')) return;

  const style = document.createElement('style');
  style.id = 'mesulo-wrapper-styles';
  style.textContent = `
    .mesulo-video-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    
    .mesulo-base-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
      pointer-events: none;
    }
    
    .mesulo-video-wrapper video {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      opacity: 0;
      filter: blur(10px);
      visibility: hidden;
    }
    
    .mesulo-video-wrapper video.mesulo-video-transitioning {
      opacity: 0;
      filter: blur(10px);
      transition: opacity 2s ease-in-out, filter 2s ease-in-out;
    }
    
    .mesulo-video-wrapper video.mesulo-video-visible {
      opacity: 1 !important;
      filter: blur(0) !important;
      visibility: visible !important;
      transition: opacity 2s ease-in-out, filter 2s ease-in-out;
    }
    
    .mesulo-video-wrapper .mesulo-video-update-spinner {
      z-index: 3;
      position: absolute;
      bottom: 10px;
      right: 10px;
    }
  `;
  
  document.head.appendChild(style);
}

