class VideoManager {
    constructor(element, gameId) {
      this.element = element;
      this.gameId = gameId;
      this.videos = new Map();
      this.currentHovered = null;
      this.videoElement = null;
      this.spinner = null;
      this.isInitialLoad = true;
      this._createListeners();
      this._injectSpinnerStyles();
    }
    
    _injectSpinnerStyles() {
      if (document.getElementById('mesulo-spinner-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'mesulo-spinner-styles';
      style.textContent = `
        .mesulo-spinner {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          animation: mesulo-spin 0.8s linear infinite;
          z-index: 1000;
        }
        
        @keyframes mesulo-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .mesulo-spinner-container {
          position: relative;
          display: inline-block;
        }
        
        .mesulo-fade-transition {
          transition: opacity 0.5s ease-in-out;
        }
      `;
      document.head.appendChild(style);
    }
    
    _createSpinner() {
      const spinner = document.createElement('div');
      spinner.className = 'mesulo-spinner';
      return spinner;
    }
    
    _showSpinner(element) {
      this._removeSpinner();
      
      this.spinner = this._createSpinner();
      
      const parent = element.parentElement;
      if (parent && window.getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      
      if (element.parentElement) {
        element.parentElement.style.position = 'relative';
        element.parentElement.appendChild(this.spinner);
      }
    }
    
    _removeSpinner() {
      if (this.spinner && this.spinner.parentElement) {
        this.spinner.parentElement.removeChild(this.spinner);
      }
      this.spinner = null;
    }
  
    _deepestElementFromPoint(x, y) {
      const seen = new Set();
      let el = document.elementFromPoint(x, y);
      let underneath = null;
  
      while (el && !seen.has(el)) {
        seen.add(el);
  
        if (/^(BUTTON|A|INPUT|LABEL|SELECT|TEXTAREA)$/i.test(el.tagName)) {
          return el;
        }
  
        const prev = el.style.pointerEvents;
        el.style.pointerEvents = 'none';
        underneath = document.elementFromPoint(x, y);
        el.style.pointerEvents = prev;
  
        if (underneath && underneath.tagName === 'VIDEO') {
          return underneath;
        }
  
        el = underneath;
      }
  
      return underneath;
    }
  
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
  
    _createListeners() {
      document.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        this._handleHover(e.clientX, e.clientY);
      });
  
      document.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch') return;
        const el = this._deepestElementFromPoint(e.clientX, e.clientY);
        if (!el) return;

        if (/^(BUTTON|A|INPUT|LABEL|SELECT|TEXTAREA)$/i.test(el.tagName)) {
          return;
        }
        
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
  
      window.addEventListener('scroll', () => {
        if (this.currentHovered && !this.currentHovered.paused) {
          this.currentHovered.pause();
          this.currentHovered = null;
        }
      }, { passive: true });
    }
  
    updateVideo(videoElement, videoUrl, imageUrl, variant = 'A') {
      if (!videoElement || videoElement.tagName !== 'VIDEO') {
        return;
      }
      
      if (!videoElement.classList.contains('mesulo-fade-transition')) {
        videoElement.classList.add('mesulo-fade-transition');
      }
      
      const wasPlaying = !videoElement.paused;
      
      setTimeout(() => {
        this._showSpinner(videoElement);
        
        setTimeout(() => {
          videoElement.style.opacity = '0';
          
          setTimeout(() => {
            videoElement.src = videoUrl;
            videoElement.poster = imageUrl;
            videoElement.setAttribute('data-mesulo-variant', variant);
            
            videoElement.style.opacity = '1';
            
            if (wasPlaying) {
              videoElement.play().catch(() => {});
            }
            
            setTimeout(() => {
              this._removeSpinner();
            }, 500);
            
            if (this.videos.has(videoElement)) {
              const data = this.videos.get(videoElement);
              data.originalSrc = imageUrl;
              this.videos.set(videoElement, data);
            }
          }, 300);
        }, 1000);
      }, 2000);
    }
  
    replaceImage(element, gameId, videoUrl, imageUrl, variant = 'A', forceDelay = false) {
      if (element && element.tagName === 'VIDEO') {
        this.updateVideo(element, videoUrl, imageUrl, variant);
        return;
      }
      
      if (this.videoElement && this.videoElement.tagName === 'VIDEO') {
        this.updateVideo(this.videoElement, videoUrl, imageUrl, variant);
        return;
      }
      
      const img = element;
      if (!img || img.tagName !== 'IMG') {
        return;
      }
      
      if (this.isInitialLoad || forceDelay) {
        this._replaceImageWithDelay(img, gameId, videoUrl, imageUrl, variant);
        this.isInitialLoad = false;
      } else {
        this._performReplacement(img, gameId, videoUrl, imageUrl, false, variant);
      }
    }
    
    _replaceImageWithDelay(img, gameId, videoUrl, imageUrl, variant = 'A') {
      setTimeout(() => {
        this._showSpinner(img);
        
        setTimeout(() => {
          this._performReplacement(img, gameId, videoUrl, imageUrl, true, variant);
        }, 1000);
      }, 2000);
    }
    
    _performReplacement(img, gameId, videoUrl, imageUrl, withFade = false, variant = 'A') {
      const video = document.createElement('video');
      const computedStyles = window.getComputedStyle(img);
  
      video.style.cssText = `
        ${img.getAttribute('style') || ''}
        object-fit: ${computedStyles.objectFit || 'cover'};
        pointer-events: auto;
        cursor: pointer;
        display: inline-block;
      `;
      
      if (withFade) {
        video.classList.add('mesulo-fade-transition');
        video.style.opacity = '0';
      }
  
      video.className = img.className + (withFade ? ' mesulo-fade-transition' : '');
  
      video.setAttribute('width', img.getAttribute('width') || computedStyles.width);
      video.setAttribute('height', img.getAttribute('height') || computedStyles.height);
      video.setAttribute('data-mesulo-game-id', gameId);
      video.setAttribute('data-mesulo-variant', variant);
      if (img.alt) video.setAttribute('title', img.alt);
  
      video.src = videoUrl;
      video.poster = imageUrl;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'metadata';
  
      this.videos.set(video, {
        playing: false,
        originalSrc: img.src,
        gameId: gameId
      });
      
      this.videoElement = video;
  
      img.replaceWith(video);
      
      if (withFade) {
        requestAnimationFrame(() => {
          video.style.opacity = '1';
          
          setTimeout(() => {
            this._removeSpinner();
          }, 500);
        });
      } else {
        this._removeSpinner();
      }
    }
  }

  export { VideoManager };