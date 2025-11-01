class VideoManager {
    constructor(element, gameId) {
      this.element = element;
      this.gameId = gameId;
      this.videos = new Map();
      this.currentHovered = null;
      this.videoElement = null; // Store reference to the video element
      this.spinner = null; // Store reference to spinner element
      this.isInitialLoad = true; // Track if this is the first load
      this._createListeners();
      this._injectSpinnerStyles();
    }
    
    // Inject spinner styles into document head (only once)
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
    
    // Create spinner element
    _createSpinner() {
      const spinner = document.createElement('div');
      spinner.className = 'mesulo-spinner';
      return spinner;
    }
    
    // Show spinner on element
    _showSpinner(element) {
      // Remove any existing spinner first
      this._removeSpinner();
      
      // Create and add spinner
      this.spinner = this._createSpinner();
      
      // Ensure parent has relative positioning
      const parent = element.parentElement;
      if (parent && window.getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      
      // Add spinner to parent or create wrapper
      if (element.parentElement) {
        element.parentElement.style.position = 'relative';
        element.parentElement.appendChild(this.spinner);
      }
    }
    
    // Remove spinner
    _removeSpinner() {
      if (this.spinner && this.spinner.parentElement) {
        this.spinner.parentElement.removeChild(this.spinner);
      }
      this.spinner = null;
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
          
          console.log('skipping interactive element', el.tagName);
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

        // If the element is an interactive element, don't interfere with clicks
        if (/^(BUTTON|A|INPUT|LABEL|SELECT|TEXTAREA)$/i.test(el.tagName)) {
          return; // Let the interactive element handle the click
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
  
      // Optional: auto-pause when scrolling
      window.addEventListener('scroll', () => {
        if (this.currentHovered && !this.currentHovered.paused) {
          this.currentHovered.pause();
          this.currentHovered = null;
        }
      }, { passive: true });
    }
  
    // Update existing video element with new sources (with delays and spinner)
    updateVideo(videoElement, videoUrl, imageUrl) {
      if (!videoElement || videoElement.tagName !== 'VIDEO') {
        return;
      }
      
      // Ensure video has transition class
      if (!videoElement.classList.contains('mesulo-fade-transition')) {
        videoElement.classList.add('mesulo-fade-transition');
      }
      
      // Store current playing state
      const wasPlaying = !videoElement.paused;
      
      // Step 1: Wait 2 seconds
      setTimeout(() => {
        // Step 2: Show spinner
        this._showSpinner(videoElement);
        
        // Step 3: Wait 1 second with spinner visible
        setTimeout(() => {
          // Step 4: Fade out current video
          videoElement.style.opacity = '0';
          
          // Step 5: Update sources after brief fade
          setTimeout(() => {
            videoElement.src = videoUrl;
            videoElement.poster = imageUrl;
            
            // Fade back in
            videoElement.style.opacity = '1';
            
            // Preserve playing state if it was playing
            if (wasPlaying) {
              videoElement.play().catch(() => {});
            }
            
            // Remove spinner after fade completes
            setTimeout(() => {
              this._removeSpinner();
            }, 500);
            
            // Update the videos Map
            if (this.videos.has(videoElement)) {
              const data = this.videos.get(videoElement);
              data.originalSrc = imageUrl;
              this.videos.set(videoElement, data);
            }
          }, 300); // Brief fade out duration
        }, 1000); // Spinner display duration
      }, 2000); // Initial delay
    }
  
    // Replace <img> with <video> or update existing <video>
    replaceImage(element, gameId, videoUrl, imageUrl) {
      // Check if element is already a video
      if (element && element.tagName === 'VIDEO') {
        this.updateVideo(element, videoUrl, imageUrl);
        return;
      }
      
      // Check if we have a stored video element reference
      if (this.videoElement && this.videoElement.tagName === 'VIDEO') {
        this.updateVideo(this.videoElement, videoUrl, imageUrl);
        return;
      }
      
      // Original image replacement logic
      const img = element;
      if (!img || img.tagName !== 'IMG') {
        return;
      }
      
      // Handle initial load with delays and spinner
      if (this.isInitialLoad) {
        this._replaceImageWithDelay(img, gameId, videoUrl, imageUrl);
        this.isInitialLoad = false; // Mark as loaded
      } else {
        // Immediate replacement for subsequent updates
        this._performReplacement(img, gameId, videoUrl, imageUrl);
      }
    }
    
    // Perform the actual image to video replacement with timing and spinner
    _replaceImageWithDelay(img, gameId, videoUrl, imageUrl) {
      // Step 1: Wait 2 seconds
      setTimeout(() => {
        // Step 2: Show spinner
        this._showSpinner(img);
        
        // Step 3: Wait 1 second with spinner visible
        setTimeout(() => {
          // Step 4: Perform replacement with fade transition
          this._performReplacement(img, gameId, videoUrl, imageUrl, true);
        }, 1000);
      }, 2000);
    }
    
    // Core replacement logic
    _performReplacement(img, gameId, videoUrl, imageUrl, withFade = false) {
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
      
      // Add fade transition class
      if (withFade) {
        video.classList.add('mesulo-fade-transition');
        video.style.opacity = '0';
      }
  
      video.className = img.className + (withFade ? ' mesulo-fade-transition' : '');
  
      video.setAttribute('width', img.getAttribute('width') || computedStyles.width);
      video.setAttribute('height', img.getAttribute('height') || computedStyles.height);
      video.setAttribute('data-mesulo-game-id', gameId);
      if (img.alt) video.setAttribute('title', img.alt);
  
      // Video source setup
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
      
      // Store reference to the video element
      this.videoElement = video;
  
      // Replace image with video
      img.replaceWith(video);
      
      // Fade in the video and remove spinner
      if (withFade) {
        // Small delay to ensure DOM is updated
        requestAnimationFrame(() => {
          video.style.opacity = '1';
          
          // Remove spinner after fade completes
          setTimeout(() => {
            this._removeSpinner();
          }, 500); // Match CSS transition duration
        });
      } else {
        this._removeSpinner();
      }
    }
  }

  export { VideoManager };