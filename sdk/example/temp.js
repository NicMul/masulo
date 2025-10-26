/**
 * Masulo Thumbnail SDK
 * Version: 1.0.3 - Fixed desktop hover and mobile tap behavior
 * Handles dynamic game image updates with beautiful transitions
 */
(function() {
    'use strict';
    
    const CONFIG = {
      development: {
        serverUrl: 'https://nodejs-production-9eae9.up.railway.app',
        cdnUrl: 'https://mesulo.b-cdn.net'
      },
      production: {
        serverUrl: 'https://nodejs-production-9eae9.up.railway.app',
        cdnUrl: 'https://mesulo.b-cdn.net'
      }
    };
    
    // Detect environment
    const isDevelopment = ['localhost', '127.0.0.1'].some(host => 
      window.location.hostname.includes(host)) || 
      window.location.protocol === 'file:' ||
      !window.location.hostname;
    
    const currentConfig = isDevelopment ? CONFIG.development : CONFIG.production;
    
    // Web Component for Masulo Game
    class MasuloGameElement extends HTMLElement {
      constructor() {
        super();
        this.gameId = null;
        this.fallbackSrc = null;
        this.isTagged = false;
        this.isPlaying = false;
        this.sdk = null;
        this.originalElement = null;
        this.trackingData = null;
        this.isTouchDevice = ('ontouchstart' in window && navigator.maxTouchPoints > 0) || 
                            (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Tablet'));
        
        // Create shadow DOM
        this.attachShadow({ mode: 'open' });
        this.render();
      }
      
      static get observedAttributes() {
        return ['game-id', 'src', 'tag'];
      }
      
      connectedCallback() {
        this.gameId = this.getAttribute('game-id');
        this.fallbackSrc = this.getAttribute('src');
        this.isTagged = this.getAttribute('tag') === 'true';
        
        // Find the SDK instance
        this.sdk = window.masulo;
        
        if (this.sdk) {
          this.setupVideoControls();
          this.setupAnalytics();
        } else {
          // Retry after a short delay in case SDK is still initializing
          setTimeout(() => {
            this.sdk = window.masulo;
            if (this.sdk) {
              this.setupVideoControls();
              this.setupAnalytics();
            }
          }, 100);
        }
      }
      
      disconnectedCallback() {
        this.cleanup();
      }
      
      attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'game-id') {
          this.gameId = newValue;
        } else if (name === 'src') {
          this.fallbackSrc = newValue;
        } else if (name === 'tag') {
          this.isTagged = newValue === 'true';
        }
      }
      
      render() {
        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              position: relative;
              overflow: hidden;
              cursor: pointer;
              user-select: none;
              -webkit-user-select: none;
              -webkit-touch-callout: none;
            }
            
            .container {
              position: relative;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            
            .game-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
              will-change: opacity;
              transition: opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
              backface-visibility: hidden;
              -webkit-font-smoothing: subpixel-antialiased;
              transform: translateZ(0);
              user-select: none;
              -webkit-user-select: none;
              -webkit-touch-callout: none;
              pointer-events: none;
              display: block;
            }
            
            .game-video {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: none;
              z-index: 2;
              user-select: none;
              -webkit-user-select: none;
              -webkit-touch-callout: none;
              pointer-events: none;
            }
            
            .loader {
              position: absolute;
              bottom: 10px;
              right: 10px;
              width: 16px;
              height: 16px;
              opacity: 0;
              transition: opacity 0.3s ease;
              pointer-events: none;
              z-index: 10;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='12' r='10' stroke='white' stroke-width='2' stroke-linecap='round' stroke-dasharray='30 10' opacity='0.6'/%3E%3C/svg%3E");
              background-size: contain;
              background-repeat: no-repeat;
              animation: spin 1s linear infinite;
            }
            
            .container.loading .loader {
              opacity: 1;
            }
            
            .container.loading .game-image {
              opacity: 1;
            }
            
            .container.fade-out .game-image {
              opacity: 0;
            }
            
            .container.loaded .game-image {
              opacity: 1;
            }
            
            .container.video-active .game-image {
              display: none;
            }
            
            .container.video-active .game-video {
              display: block;
            }
            
            /* Button styling - FIXED: Removed :host(:hover) to prevent desktop hover issues */
            ::slotted(button) {
              transition: all 0.3s ease !important;
              backdrop-filter: blur(0px) !important;
              opacity: 0 !important;
              visibility: hidden !important;
              display: block !important;
              pointer-events: none !important;
            }
            
            /* Only show button when video is active (not on hover) */
            .container.video-active ::slotted(button) {
              background: rgba(0, 0, 0, 0.5) !important;
              border-color: #ffd700 !important;
              backdrop-filter: blur(2px) !important;
              opacity: 0.7 !important;
              visibility: visible !important;
              color: white !important;
              font-weight: bold !important;
              pointer-events: auto !important;
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
          <div class="container">
            <img class="game-image" src="${this.fallbackSrc || ''}" alt="Game">
            <video class="game-video" muted loop playsinline preload="metadata"></video>
            <div class="loader"></div>
            <slot name="button"></slot>
          </div>
        `;
      }
      
      setupVideoControls() {
        const container = this.shadowRoot.querySelector('.container');
        const imgElement = this.shadowRoot.querySelector('.game-image');
        const videoElement = this.shadowRoot.querySelector('.game-video');
        
        console.log(`Device detection: isTouchDevice=${this.isTouchDevice}, ontouchstart=${'ontouchstart' in window}, maxTouchPoints=${navigator.maxTouchPoints}`);
        
        if (this.isTouchDevice) {
          console.log(`Setting up TOUCH events for game ${this.gameId}`);
          this.setupMobileControls(container, videoElement);
        } else {
          console.log(`Setting up MOUSE events for game ${this.gameId}`);
          this.setupDesktopControls(container, videoElement);
        }
      }
      
      setupMobileControls(container, videoElement) {
        // Mobile behavior: Tap to toggle video
        container.addEventListener('touchend', (e) => {
          console.log(`Touch end on game ${this.gameId}`);
          
          // Check if tap was on the button - if so, let it navigate (don't toggle video)
          const button = this.querySelector('[slot="button"]');
          if (button && e.composedPath().includes(button)) {
            console.log(`Tap was on button for game ${this.gameId}, allowing navigation`);
            return; // Let button handle the navigation
          }
          
          // Tap was on video area - toggle video playback
          e.preventDefault();
          e.stopPropagation();
          
          if (this.isPlaying) {
            // Stop video but keep button visible
            console.log(`Stopping video for game ${this.gameId}, keeping button visible`);
            this.stopVideo(false); // false = don't hide button
          } else {
            // Start video - deactivate any other playing video first
            console.log(`Starting video for game ${this.gameId}`);
            if (this.sdk) {
              this.sdk.deactivateAllVideos(true, false); // Hide other video buttons
            }
            this.playVideo();
          }
        }, { passive: false });
      }
      
      setupDesktopControls(container, videoElement) {
        // Desktop behavior: Click on video area (not button) to toggle
        container.addEventListener('click', (e) => {
          console.log(`Click on game ${this.gameId}`);
          
          // Check if click was on the button - if so, let it navigate
          const button = this.querySelector('[slot="button"]');
          if (button && e.composedPath().includes(button)) {
            console.log(`Click was on button for game ${this.gameId}, allowing navigation`);
            return; // Let button handle the navigation
          }
          
          // Click was on video area - toggle video playback
          e.preventDefault();
          e.stopPropagation();
          
          if (this.isPlaying) {
            console.log(`Stopping video for game ${this.gameId}`);
            this.stopVideo(false); // Keep button visible on desktop too
          } else {
            console.log(`Starting video for game ${this.gameId}`);
            if (this.sdk) {
              this.sdk.deactivateAllVideos(true, false);
            }
            this.playVideo();
          }
        });
        
        // NO HOVER EVENTS - Fixed desktop issue
        // Removed mouseenter/mouseleave to prevent unwanted triggering
      }
      
      setupAnalytics() {
        const container = this.shadowRoot.querySelector('.container');
        const imgElement = this.shadowRoot.querySelector('.game-image');
        const videoElement = this.shadowRoot.querySelector('.game-video');
        
        // Track image impressions
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && this.sdk && this.sdk.analyticsEnabled) {
              const imageUrl = imgElement.src;
              if (imageUrl && !this.trackingData?.lastImageUrl || this.trackingData.lastImageUrl !== imageUrl) {
                this.sdk.trackAssetEvent('image_impression', this.gameId, 'image', imageUrl, {
                  visibility_ratio: entry.intersectionRatio,
                  viewport: this.sdk.getViewportInfo()
                });
                
                if (!this.trackingData) {
                  this.trackingData = {};
                }
                this.trackingData.lastImageUrl = imageUrl;
              }
            }
          });
        }, { threshold: [0.5] });
        
        imageObserver.observe(container);
        
        // Track video playback
        if (videoElement) {
          videoElement.addEventListener('play', () => {
            if (this.sdk && this.sdk.analyticsEnabled) {
              const videoUrl = videoElement.src;
              this.sdk.trackAssetEvent('video_play', this.gameId, 'video', videoUrl, {
                duration: videoElement.duration,
                currentTime: videoElement.currentTime
              });
            }
          });
          
          videoElement.addEventListener('pause', () => {
            if (this.sdk && this.sdk.analyticsEnabled) {
              const videoUrl = videoElement.src;
              this.sdk.trackAssetEvent('video_pause', this.gameId, 'video', videoUrl, {
                duration: videoElement.duration,
                currentTime: videoElement.currentTime,
                watchedPercentage: (videoElement.currentTime / videoElement.duration) * 100
              });
            }
          });
          
          videoElement.addEventListener('ended', () => {
            if (this.sdk && this.sdk.analyticsEnabled) {
              const videoUrl = videoElement.src;
              this.sdk.trackAssetEvent('video_complete', this.gameId, 'video', videoUrl, {
                duration: videoElement.duration
              });
            }
          });
        }
        
        // Store observer for cleanup
        this.imageObserver = imageObserver;
      }
      
      playVideo() {
        const container = this.shadowRoot.querySelector('.container');
        const videoElement = this.shadowRoot.querySelector('.game-video');
        
        if (!videoElement.src) {
          console.log(`No video source for game ${this.gameId}`);
          return;
        }
        
        console.log(`Playing video for game ${this.gameId}`);
        
        // Register this as the active video
        if (this.sdk) {
          this.sdk.activeVideoContainer = this;
        }
        
        this.isPlaying = true;
        container.classList.add('video-active');
        
        videoElement.play().catch(err => {
          console.error(`Error playing video for game ${this.gameId}:`, err);
          this.isPlaying = false;
          container.classList.remove('video-active');
        });
      }
      
      stopVideo(hideButton = false) {
        const container = this.shadowRoot.querySelector('.container');
        const videoElement = this.shadowRoot.querySelector('.game-video');
        
        console.log(`Stopping video for game ${this.gameId}, hideButton=${hideButton}`);
        
        this.isPlaying = false;
        videoElement.pause();
        videoElement.currentTime = 0;
        
        if (hideButton) {
          // Full deactivation - hide button
          container.classList.remove('video-active');
        }
        // If hideButton is false, keep video-active class so button stays visible
      }
      
      deactivate(hideButton = false, forceHideButton = false) {
        const container = this.shadowRoot.querySelector('.container');
        const videoElement = this.shadowRoot.querySelector('.game-video');
        
        console.log(`Deactivating game ${this.gameId}, hideButton=${hideButton}, forceHideButton=${forceHideButton}`);
        
        this.isPlaying = false;
        videoElement.pause();
        videoElement.currentTime = 0;
        
        if (hideButton || forceHideButton) {
          container.classList.remove('video-active');
        }
      }
      
      updateImage(imageUrl, videoUrl) {
        const container = this.shadowRoot.querySelector('.container');
        const imgElement = this.shadowRoot.querySelector('.game-image');
        const videoElement = this.shadowRoot.querySelector('.game-video');
        
        // If currently playing, stop it
        if (this.isPlaying) {
          this.stopVideo(true);
        }
        
        // Update video source
        if (videoUrl) {
          videoElement.src = videoUrl;
          videoElement.load();
        } else {
          videoElement.removeAttribute('src');
          videoElement.load();
        }
        
        // Update image with fade effect
        if (imageUrl && imageUrl !== imgElement.src) {
          container.classList.add('loading', 'fade-out');
          
          const newImg = new Image();
          newImg.onload = () => {
            imgElement.src = imageUrl;
            container.classList.remove('fade-out');
            setTimeout(() => {
              container.classList.remove('loading');
              container.classList.add('loaded');
              setTimeout(() => container.classList.remove('loaded'), 300);
            }, 50);
          };
          newImg.onerror = () => {
            container.classList.remove('loading', 'fade-out');
          };
          newImg.src = imageUrl;
        }
      }
      
      revertToDefault(defaultImageUrl) {
        this.updateImage(defaultImageUrl, null);
      }
      
      cleanup() {
        if (this.imageObserver) {
          this.imageObserver.disconnect();
        }
        
        const videoElement = this.shadowRoot.querySelector('.game-video');
        if (videoElement) {
          videoElement.pause();
          videoElement.src = '';
          videoElement.load();
        }
      }
      
      testVideo() {
        const videoElement = this.shadowRoot.querySelector('.game-video');
        console.log('Video element:', videoElement);
        console.log('Video src:', videoElement?.src);
        console.log('Is playing:', this.isPlaying);
        console.log('Game ID:', this.gameId);
        
        if (videoElement && videoElement.src) {
          console.log('Testing video playback...');
          this.playVideo();
        } else {
          console.log('No video source available');
        }
      }
    }
    
    // Register the custom element
    if (!customElements.get('masulo-game')) {
      customElements.define('masulo-game', MasuloGameElement);
    }
    
    // Main SDK Class
    class MasuloSDK {
      constructor(config = {}) {
        this.applicationKey = config.applicationKey;
        this.isConnected = false;
        this.socket = null;
        this.statusCallbacks = [];
        this.statusElements = [];
        this.activeVideoContainer = null;
        this.isScrolling = false;
        this.scrollStartY = 0;
        this.SCROLL_THRESHOLD = 30; // pixels
        this.connectionRetryCount = 0;
        this.maxConnectionRetries = 10;
        
        this.statusConfig = {
          connectedText: config.connectedText || 'Connected',
          disconnectedText: config.disconnectedText || 'Disconnected',
          connectingText: config.connectingText || 'Connecting...',
          connectedClass: config.connectedClass || 'masulo-connected',
          disconnectedClass: config.disconnectedClass || 'masulo-disconnected',
          connectingClass: config.connectingClass || 'masulo-connecting'
        };
        
        // Analytics
        this.analyticsEnabled = config.analytics !== false;
        this.sessionId = this.generateSessionId();
        
        if (this.applicationKey) {
          this.waitForSocketIO();
          this.setupScrollDetection();
        }
      }
      
      waitForSocketIO() {
        // Check if Socket.IO is already loaded
        if (typeof io !== 'undefined') {
          console.log('Socket.IO detected, connecting...');
          this.connect();
          return;
        }
        
        // Dynamically load Socket.IO from Mesulo CDN
        console.log('Loading Socket.IO from Mesulo CDN...');
        
        const script = document.createElement('script');
        script.src = `${currentConfig.cdnUrl}/socket.io.min.js`;
        script.async = true;
        
        script.onload = () => {
          console.log('Socket.IO loaded successfully, connecting...');
          this.connect();
        };
        
        script.onerror = () => {
          console.error('Failed to load Socket.IO from Mesulo CDN');
          console.error('Please check your internet connection or contact support');
          this.updateStatus('disconnected');
        };
        
        // Append to document head
        document.head.appendChild(script);
      }
      
      connect() {
        if (this.socket?.connected) {
          return;
        }
        
        // Safety check for Socket.IO
        if (typeof io === 'undefined') {
          console.error('Socket.IO (io) is not defined. Cannot connect.');
          console.error('Socket.IO should have been auto-loaded from Mesulo CDN. Please check your internet connection.');
          this.updateStatus('disconnected');
          return;
        }
        
        this.updateStatus('connecting');
        
        try {
          this.socket = io(currentConfig.serverUrl, {
            auth: { applicationKey: this.applicationKey },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000
          });
          
          this.socket.on('connect', () => {
            console.log('SDK connected to server');
            this.isConnected = true;
            this.updateStatus('connected');
            this.emit('connected');
            this.requestGames();
          });
          
          this.socket.on('disconnect', (reason) => {
            console.log('SDK disconnected:', reason);
            this.isConnected = false;
            this.updateStatus('disconnected');
            this.emit('disconnected', { reason });
          });
          
          this.socket.on('connect_error', (error) => {
            console.error('SDK connection error:', error);
            this.updateStatus('disconnected');
            this.emit('error', { type: 'connection', error });
          });
          
          this.socket.on('games-updated', (data) => {
            console.log('Received game update:', data);
            this.emit('game-updated', data);
            if (data.games) {
              this.updateSpecificGames(data.games);
            }
          });
          
          this.socket.on('games-response', (data) => {
            console.log('Received initial games data');
            if (data.games) {
              this.updateSpecificGames(data.games);
            }
          });
          
        } catch (error) {
          console.error('Socket initialization error:', error);
          this.updateStatus('disconnected');
        }
      }
      
      setupScrollDetection() {
        let scrollTimeout;
        
        const handleTouchStart = (e) => {
          this.scrollStartY = e.touches[0].clientY;
          this.isScrolling = false;
        };
        
        const handleTouchMove = (e) => {
          if (!this.scrollStartY) return;
          
          const deltaY = Math.abs(e.touches[0].clientY - this.scrollStartY);
          
          // If user scrolls more than threshold, mark as scrolling and deactivate video
          if (deltaY > this.SCROLL_THRESHOLD && !this.isScrolling) {
            this.isScrolling = true;
            console.log(`Scroll detected (${deltaY}px), deactivating video`);
            // When scrolling >30px, hide button and stop video (full deactivation)
            this.deactivateAllVideos(true, true);
          }
        };
        
        const handleTouchEnd = () => {
          this.scrollStartY = 0;
          // Reset scrolling flag after a short delay
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
          }, 100);
        };
        
        // Add global scroll detection
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
      }
      
      // Deactivate all videos (stop playing, optionally hide button)
      deactivateAllVideos(hideButton = false, forceHideButton = false) {
        if (this.activeVideoContainer) {
          this.activeVideoContainer.deactivate(hideButton, forceHideButton);
          this.activeVideoContainer = null;
        }
      }
      
      requestGames() {
        // Get only tagged games (data-masulo-tag="true") for both initial load and real-time updates
        const taggedGameElements = document.querySelectorAll('[data-masulo-tag="true"]');
        const taggedGameIds = Array.from(taggedGameElements)
          .map(el => el.getAttribute('data-masulo-game-id'))
          .filter(Boolean);
        
        console.log('Found tagged game elements:', taggedGameElements.length);
        console.log('Game IDs to request:', taggedGameIds);
        
        if (taggedGameIds.length === 0) {
          console.log('No tagged games found, skipping request');
          return;
        }
        
        // Join game rooms for real-time updates
        this.socket.emit('join-game-rooms', {
          gameIds: taggedGameIds,
          timestamp: new Date().toISOString()
        });
        
        // Request initial game data for tagged games only
        this.socket.emit('sdk-event', {
          event: 'get-games',
          data: { gameIds: taggedGameIds },
          timestamp: new Date().toISOString()
        });
      }
      
      updateSpecificGames(gamesData) {
        console.log('Updating games with data:', gamesData);
        
        gamesData.forEach(game => {
          // Check if this game exists on the page with data-masulo-tag="true"
          const container = document.querySelector(`[data-masulo-game-id="${game.id}"][data-masulo-tag="true"]`);
          
          if (!container) {
            console.log(`No container found for game ${game.id}`);
            return;
          }
          
          console.log(`Updating game ${game.id}:`, game);
          
          // If game is not published, revert to defaultImage only (no video)
          if (!game.published) {
            this.revertGameToDefault(game.id, game.defaultImage);
            return;
          }
          
          // Determine which image/video to use based on publishedType
          let imageUrl = game.defaultImage;
          let videoUrl = game.defaultVideo;
          
          if (game.publishedType === 'current' && game.currentImage) {
            imageUrl = game.currentImage;
            videoUrl = game.currentVideo;
          } else if (game.publishedType === 'theme' && game.themeImage) {
            imageUrl = game.themeImage;
            videoUrl = game.themeVideo;
          } else if (game.publishedType === 'promo' && game.promoImage) {
            imageUrl = game.promoImage;
            videoUrl = game.promoVideo;
          } else if (game.publishedType === 'default' && game.defaultImage) {
            imageUrl = game.defaultImage;
            videoUrl = game.defaultVideo;
          }
          
          // Update the image
          const imgElement = container.querySelector('img');
          if (imgElement && imageUrl) {
            console.log(`Updating image for ${game.id} to:`, imageUrl);
            imgElement.src = imageUrl;
            
            // Ensure image has transition for smooth video fade effects
            if (!imgElement.style.transition) {
              imgElement.style.transition = 'opacity 0.3s ease';
            }
          }
          
          // Setup video functionality if video URL is available
          if (videoUrl) {
            console.log(`Setting up video for ${game.id}:`, videoUrl);
            this.setupVideoForContainer(container, game.id, videoUrl, imgElement);
          }
        });
      }
      
      setupVideoForContainer(container, gameId, videoUrl, imgElement) {
        // Check if video element already exists
        let videoElement = container.querySelector('.masulo-video');
        
        if (!videoElement) {
          // Create video element
          videoElement = document.createElement('video');
          videoElement.className = 'masulo-video';
          videoElement.muted = true;
          videoElement.loop = true;
          videoElement.playsInline = true;
          videoElement.preload = 'metadata';
          videoElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            z-index: 1;
          `;
          
          // Insert video after image
          if (imgElement && imgElement.parentNode === container) {
            imgElement.parentNode.insertBefore(videoElement, imgElement.nextSibling);
          } else {
            container.appendChild(videoElement);
          }
          
          console.log(`Created video element for ${gameId}`);
        }
        
        // Update video source
        videoElement.src = videoUrl;
        
        // Store reference for later use
        container.dataset.masuloVideoUrl = videoUrl;
        container.dataset.masuloHasVideo = 'true';
        
        // Make container position relative if not already
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.position === 'static') {
          container.style.position = 'relative';
        }
        
        // Add hover/click event listeners if not already added
        if (!container.dataset.masuloVideoSetup) {
          this.addVideoEventListeners(container, videoElement, imgElement, gameId);
          container.dataset.masuloVideoSetup = 'true';
        }
      }
      
      addVideoEventListeners(container, videoElement, imgElement, gameId) {
        const isTouchDevice = ('ontouchstart' in window && navigator.maxTouchPoints > 0) || 
                             (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Tablet'));
        
        if (isTouchDevice) {
          // Mobile: Click to toggle video
          container.addEventListener('click', (e) => {
            // Don't trigger if clicking on a button
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
              return;
            }
            
            e.preventDefault();
            const isPlaying = container.dataset.masuloVideoPlaying === 'true';
            
            if (isPlaying) {
              this.stopContainerVideo(container, videoElement, imgElement, gameId);
            } else {
              this.playContainerVideo(container, videoElement, imgElement, gameId);
            }
          });
        } else {
          // Desktop: Hover to play video
          container.addEventListener('mouseenter', () => {
            this.playContainerVideo(container, videoElement, imgElement, gameId);
          });
          
          container.addEventListener('mouseleave', () => {
            this.stopContainerVideo(container, videoElement, imgElement, gameId);
          });
        }
        
        console.log(`Added ${isTouchDevice ? 'touch' : 'hover'} event listeners for ${gameId}`);
      }
      
      playContainerVideo(container, videoElement, imgElement, gameId) {
        console.log(`Playing video for ${gameId}`);
        
        // Fade out image, fade in video
        if (imgElement) {
          imgElement.style.opacity = '0';
        }
        videoElement.style.opacity = '1';
        
        // Play video
        videoElement.play().catch(err => {
          console.error(`Error playing video for ${gameId}:`, err);
        });
        
        container.dataset.masuloVideoPlaying = 'true';
        
        // Track analytics if enabled
        if (this.analyticsEnabled) {
          this.trackAssetEvent('video_play', gameId, 'video', videoElement.src, {
            trigger: 'hover',
            viewport: this.getViewportInfo()
          });
        }
      }
      
      stopContainerVideo(container, videoElement, imgElement, gameId) {
        console.log(`Stopping video for ${gameId}`);
        
        // Fade in image, fade out video
        if (imgElement) {
          imgElement.style.opacity = '1';
        }
        videoElement.style.opacity = '0';
        
        // Stop and reset video
        videoElement.pause();
        videoElement.currentTime = 0;
        
        container.dataset.masuloVideoPlaying = 'false';
        
        // Track analytics if enabled
        if (this.analyticsEnabled) {
          this.trackAssetEvent('video_stop', gameId, 'video', videoElement.src, {
            trigger: 'hover_end',
            viewport: this.getViewportInfo()
          });
        }
      }
      
      revertGameToDefault(gameId, defaultImageUrl) {
        const container = document.querySelector(`[data-masulo-game-id="${gameId}"]`);
        if (!container) {
          return;
        }
        
        // Track game unpublish event
        this.trackAssetEvent('game_unpublished', gameId, 'defaultImage', defaultImageUrl, {
          reason: 'game_unpublished',
          reverted_to: 'defaultImage'
        });
        
        // Update the image to default
        const imgElement = container.querySelector('img');
        if (imgElement && defaultImageUrl) {
          imgElement.src = defaultImageUrl;
        }
        
        // Remove video URL
        delete container.dataset.masuloVideoUrl;
      }
      
      // Status management
      updateStatus(status) {
        this.statusCallbacks.forEach(callback => callback(status));
        this.statusElements.forEach(element => {
          const config = this.statusConfig;
          element.textContent = config[`${status}Text`];
          element.className = element.className
            .replace(/masulo-(connected|disconnected|connecting)/g, '')
            .trim() + ` ${config[`${status}Class`]}`;
        });
      }
      
      onStatusChange(callback) {
        this.statusCallbacks.push(callback);
        callback(this.isConnected ? 'connected' : 'disconnected');
      }
      
      updateStatusElements(selector) {
        document.querySelectorAll(selector).forEach(element => {
          this.statusElements.push(element);
          this.updateStatus(this.isConnected ? 'connected' : 'disconnected');
        });
      }
      
      getStatus() {
        return this.isConnected ? 'connected' : 'disconnected';
      }
      
      // Event listener methods
      on(event, callback) {
        if (!this.eventListeners) {
          this.eventListeners = {};
        }
        if (!this.eventListeners[event]) {
          this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
      }
      
      off(event, callback) {
        if (!this.eventListeners || !this.eventListeners[event]) {
          return;
        }
        if (callback) {
          const index = this.eventListeners[event].indexOf(callback);
          if (index > -1) {
            this.eventListeners[event].splice(index, 1);
          }
        } else {
          this.eventListeners[event] = [];
        }
      }
      
      emit(event, data) {
        if (!this.eventListeners || !this.eventListeners[event]) {
          return;
        }
        this.eventListeners[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in event listener:', error);
          }
        });
      }
  
      // Analytics Methods
      generateSessionId() {
        const existingSession = sessionStorage.getItem('masulo_session_id');
        if (existingSession) {
          return existingSession;
        }
        
        const sessionId = 'masulo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('masulo_session_id', sessionId);
        return sessionId;
      }
  
      getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
          return 'mobile';
        } else if (/tablet|ipad/i.test(userAgent)) {
          return 'tablet';
        }
        return 'desktop';
      }
  
      getViewportInfo() {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          device_type: this.getDeviceType(),
          timestamp: new Date().toISOString()
        };
      }
  
      trackAssetEvent(eventType, gameId, assetType, assetUrl, metadata = {}) {
        if (!this.analyticsEnabled || !this.isConnected || !this.socket) {
          return;
        }
  
        const eventData = {
          event_type: eventType,
          game_id: gameId,
          asset_type: assetType,
          asset_url: assetUrl,
          session_id: this.sessionId,
          metadata: {
            ...this.getViewportInfo(),
            ...metadata
          }
        };
  
        this.socket.emit('analytics-event', eventData);
      }
    }
    
    // Expose to global scope
    window.MasuloSDK = MasuloSDK;
    
    // Add test function for debugging
    window.testMasuloVideo = function() {
      const gameElements = document.querySelectorAll('masulo-game');
      console.log(`Found ${gameElements.length} masulo-game elements`);
      gameElements.forEach((element, index) => {
        console.log(`Testing element ${index + 1}:`, element);
        element.testVideo();
      });
    };
    
    // Auto-initialize from script tag
    const script = document.currentScript;
    if (script?.dataset.applicationKey) {
      window.masulo = new MasuloSDK({
        applicationKey: script.dataset.applicationKey
      });
    }
  })();