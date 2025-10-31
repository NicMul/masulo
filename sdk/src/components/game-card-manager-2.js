class CardVideoManager2 {
    constructor() {
     
      this.videos = new Map(); 
      
      this.setupGlobalHoverListener();
    }
    
    replaceImage(img, gameId) {
      const tagId = `${gameId}-mesulo-marker-${Math.random().toString(36).substring(2, 15)}`;
      const video = document.createElement('video');
      const computedStyles = window.getComputedStyle(img);

      video.style.cssText = computedStyles.cssText;
      video.style.cssText += `
        object-fit: ${computedStyles.objectFit || 'cover'};
        pointer-events: auto;
        cursor: pointer;
      `;
      
  
      video.className = img.className;
      video.classList.add(tagId);
      video.setAttribute('width', img.getAttribute('width') || computedStyles.width);
      video.setAttribute('height', img.getAttribute('height') || computedStyles.height);
      if (img.alt) video.setAttribute('title', img.alt);
      
      video.src = 'https://casino-cdn-45tz9ud.b-cdn.net/videos/theme-sxbadstm0.mp4'
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'metadata';
      
      this.videos.set(video, {
        playing: false,
        originalSrc: img.src
      });
      
      img.replaceWith(video);
    }
    
    setupGlobalHoverListener() {
  
      document.addEventListener('mouseenter', (e) => {
      const video = document.querySelectorAll(tagId);
      video.forEach(video => {
        if (video && this.videos.has(video)) {
          video.play().catch(err => console.log('Play failed:', err));
          this.videos.get(video).playing = true;
        }
      });
      }, true);
      
      document.addEventListener('mouseleave', (e) => {
  
        const video = document.querySelectorAll(tagId);
        video.forEach(video => {
          if (video && this.videos.has(video)) {
          video.pause();
            video.currentTime = 0;
            this.videos.get(video).playing = false;
          }
        });
      }, true);
    }
  }
  
  
  const sdk = new SimpleVideoSDK();
  
  document.querySelectorAll('data-mesulo-game-id').forEach(img => {
    const gameId = img.getAttribute('data-mesulo-game-id');
    sdk.replaceImage(img, gameId);
  });
  
  export { CardVideoManager2 };
  
  