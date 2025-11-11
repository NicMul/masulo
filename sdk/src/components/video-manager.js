import { GameCardAnalytics } from '../utils/analytics.js';

class VideoManager {
    constructor(element, gameId) {
      this.element = element;
      this.gameId = gameId;
      this.videos = new Map();
      this.currentHovered = null;
      this.videoElement = null;
      this.spinner = null;
      this.isInitialLoad = true;
      this.analytics = null;
      this._createListeners();
      this._injectSpinnerStyles();
      this._setupAnalytics();
    }
    
    _setupAnalytics() {
      console.log('[VideoManager] _setupAnalytics called', { gameId: this.gameId, hasMesulo: !!window.mesulo, elementTag: this.element.tagName });
      if (!window.mesulo) {
        console.log('[VideoManager] window.mesulo not available');
        return;
      }
      
      // Find container element (parent of the image/video)
      const container = this.element.parentElement || this.element.closest('[data-mesulo-game-id]')?.parentElement || this.element;
      console.log('[VideoManager] Creating GameCardAnalytics', { gameId: this.gameId, container: container.tagName });
      this.analytics = new GameCardAnalytics(this.gameId, container);
      
      // Set up image tracking if element is an image
      if (this.element.tagName === 'IMG') {
        console.log('[VideoManager] Setting up image tracking for', this.element.src);
        this.analytics.setupImageTracking(this.element, () => {
          const url = this.element.src || this.element.getAttribute('src');
          console.log('[VideoManager] getCurrentImageUrl called', { url });
          return url;
        });
        
        // Also check if image is already visible
        const rect = this.element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        console.log('[VideoManager] Image visibility check', { isVisible, rect: { top: rect.top, bottom: rect.bottom, windowHeight: window.innerHeight } });
      }
      
      // Set up button click tracking
      this.analytics.setupButtonClickTracking();
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
            
            // Track video play on touch
            if (this.analytics && window.mesulo) {
              const videoData = this.videos.get(video);
              const videoUrl = video.src || videoData?.videoUrl || videoData?.originalSrc;
              if (videoUrl) {
                this.analytics.trackVideoEvent('video_play', videoUrl, video);
              }
            }
          } else {
            video.pause();
            this.currentHovered = null;
            
            // Track video pause on touch
            if (this.analytics && window.mesulo) {
              const videoData = this.videos.get(video);
              const videoUrl = video.src || videoData?.videoUrl || videoData?.originalSrc;
              if (videoUrl) {
                this.analytics.trackVideoEvent('video_pause', videoUrl, video);
              }
            }
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
        gameId: gameId,
        videoUrl: videoUrl,
        imageUrl: imageUrl
      });
      
      this.videoElement = video;
      
      // Set up analytics tracking for the video
      if (this.analytics && window.mesulo) {
        this.analytics.setupVideoTracking(video, videoUrl);
        this.analytics.setupButtonClickTracking();
      }
      
      // Also track image impression before replacement
      if (this.analytics && window.mesulo && imageUrl) {
        // Use IntersectionObserver to track image impression
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && window.mesulo?.analyticsEnabled) {
              if (imageUrl && this.analytics.trackingData.lastImageUrl !== imageUrl) {
                window.mesulo.trackAssetEvent('image_impression', gameId, 'image', imageUrl, {
                  visibility_ratio: entry.intersectionRatio,
                  viewport: window.mesulo.getViewportInfo()
                });
                this.analytics.trackingData.lastImageUrl = imageUrl;
              }
              imageObserver.disconnect();
            }
          });
        }, { threshold: [0.5] });
        
        imageObserver.observe(img);
      }
  
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