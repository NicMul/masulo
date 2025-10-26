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
  
  // Debug logging helper (disabled for production)
  const debugLog = isDevelopment ? console.log : () => {};
  const debugError = isDevelopment ? console.error : () => {};
  
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
          
          .game-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            pointer-events: none;
            display: block;
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
          <video class="game-video" muted loop playsinline preload="metadata" poster="${this.fallbackSrc || ''}"></video>
          <div class="loader"></div>
          <slot name="button"></slot>
        </div>
      `;
    }
    
    setupVideoControls() {
      const container = this.shadowRoot.querySelector('.container');
      const videoElement = this.shadowRoot.querySelector('.game-video');
      
      debugLog(`Device detection: isTouchDevice=${this.isTouchDevice}, ontouchstart=${'ontouchstart' in window}, maxTouchPoints=${navigator.maxTouchPoints}`);
      
      if (this.isTouchDevice) {
        debugLog(`Setting up TOUCH events for game ${this.gameId}`);
        this.setupMobileControls(container, videoElement);
      } else {
        debugLog(`Setting up MOUSE events for game ${this.gameId}`);
        this.setupDesktopControls(container, videoElement);
      }
    }
    
    setupMobileControls(container, videoElement) {
      // Mobile behavior: Tap to toggle video
      container.addEventListener('touchend', (e) => {
        debugLog(`Touch end on game ${this.gameId}`);
        
        // Check if tap was on the button - if so, let it navigate (don't toggle video)
        const button = this.querySelector('[slot="button"]');
        if (button && e.composedPath().includes(button)) {
          debugLog(`Tap was on button for game ${this.gameId}, allowing navigation`);
          return; // Let button handle the navigation
        }
        
        // Tap was on video area - toggle video playback
        e.preventDefault();
        e.stopPropagation();
        
        if (this.isPlaying) {
          // Stop video and hide button
          debugLog(`Stopping video for game ${this.gameId}, hiding button`);
          this.stopVideo(true); // true = hide button
        } else {
          // Start video - deactivate any other playing video first
          debugLog(`Starting video for game ${this.gameId}`);
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
        debugLog(`Click on game ${this.gameId}`);
        
        // Check if click was on the button - if so, let it navigate
        const button = this.querySelector('[slot="button"]');
        if (button && e.composedPath().includes(button)) {
          debugLog(`Click was on button for game ${this.gameId}, allowing navigation`);
          return; // Let button handle the navigation
        }
        
        // Click was on video area - toggle video playback
        e.preventDefault();
        e.stopPropagation();
        
        if (this.isPlaying) {
          debugLog(`Stopping video for game ${this.gameId}`);
          this.stopVideo(true); // Hide button when stopping
        } else {
          debugLog(`Starting video for game ${this.gameId}`);
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
      const videoElement = this.shadowRoot.querySelector('.game-video');
      
      // Track video poster impressions
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && this.sdk && this.sdk.analyticsEnabled) {
            const posterUrl = videoElement.poster;
            if (posterUrl && !this.trackingData?.lastPosterUrl || this.trackingData.lastPosterUrl !== posterUrl) {
              this.sdk.trackAssetEvent('poster_impression', this.gameId, 'poster', posterUrl, {
                visibility_ratio: entry.intersectionRatio,
                viewport: this.sdk.getViewportInfo()
              });
              
              if (!this.trackingData) {
                this.trackingData = {};
              }
              this.trackingData.lastPosterUrl = posterUrl;
            }
          }
        });
      }, { threshold: [0.5] });
      
      videoObserver.observe(container);
      
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
      this.videoObserver = videoObserver;
    }
    
    playVideo() {
      const container = this.shadowRoot.querySelector('.container');
      const videoElement = this.shadowRoot.querySelector('.game-video');
      
      if (!videoElement.src) {
        debugLog(`No video source for game ${this.gameId}`);
        return;
      }
      
      debugLog(`Playing video for game ${this.gameId}`);
      
      // Register this as the active video
      if (this.sdk) {
        this.sdk.activeVideoContainer = this;
      }
      
      this.isPlaying = true;
      container.classList.add('video-active');
      
      videoElement.play().catch(err => {
        debugError(`Error playing video for game ${this.gameId}:`, err);
        this.isPlaying = false;
        container.classList.remove('video-active');
      });
    }
    
    stopVideo(hideButton = false) {
      const container = this.shadowRoot.querySelector('.container');
      const videoElement = this.shadowRoot.querySelector('.game-video');
      
      debugLog(`Stopping video for game ${this.gameId}, hideButton=${hideButton}`);
      
      this.isPlaying = false;
      videoElement.pause();
      videoElement.currentTime = 0;
      
      // Always hide button when stopping video (mobile behavior)
      container.classList.remove('video-active');
    }
    
    deactivate(hideButton = false, forceHideButton = false) {
      const container = this.shadowRoot.querySelector('.container');
      const videoElement = this.shadowRoot.querySelector('.game-video');
      
      debugLog(`Deactivating game ${this.gameId}, hideButton=${hideButton}, forceHideButton=${forceHideButton}`);
      
      this.isPlaying = false;
      videoElement.pause();
      videoElement.currentTime = 0;
      
      // Always hide button when deactivating
      container.classList.remove('video-active');
    }
    
    updateVideo(imageUrl, videoUrl) {
      const container = this.shadowRoot.querySelector('.container');
      const videoElement = this.shadowRoot.querySelector('.game-video');
      
      // If currently playing, stop it
      if (this.isPlaying) {
        this.stopVideo(true);
      }
      
      // Update video poster (image) and source
      if (imageUrl) {
        videoElement.poster = imageUrl;
      }
      
      if (videoUrl) {
        videoElement.src = videoUrl;
        videoElement.load();
      } else {
        videoElement.removeAttribute('src');
        videoElement.load();
      }
    }
    
    revertToDefault(defaultImageUrl) {
      this.updateVideo(defaultImageUrl, null);
    }
    
    cleanup() {
      if (this.videoObserver) {
        this.videoObserver.disconnect();
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
      debugLog('Video element:', videoElement);
      debugLog('Video src:', videoElement?.src);
      debugLog('Is playing:', this.isPlaying);
      debugLog('Game ID:', this.gameId);
      
      if (videoElement && videoElement.src) {
        debugLog('Testing video playback...');
        this.playVideo();
      } else {
        debugLog('No video source available');
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
        this.injectButtonStyles();
      }
    }
    
    injectButtonStyles() {
      // Inject CSS for button visibility control
      const style = document.createElement('style');
      style.textContent = `
        /* Masulo SDK Button Styles */
        .game-card {
          position: relative;
        }
        
        .game-card img,
        .game-card video {
          transition: opacity 0.5s ease-in-out;
        }
        
        .game-card.fading-out img {
          opacity: 0;
        }
        
        .game-card .loader {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 16px;
          height: 16px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 10;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='12' r='10' stroke='white' stroke-width='2' stroke-linecap='round' stroke-dasharray='30 10' opacity='0.6'/%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
          animation: spin 1s linear infinite;
        }
        
        .game-card.loading .loader {
          opacity: 1;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .game-card[data-masulo-tag="true"] .mesulo-button {
          transition: all 0.3s ease !important;
          backdrop-filter: blur(0px) !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        
        .game-card[data-masulo-tag="true"].video-active .mesulo-button {
          background: rgba(0, 0, 0, 0.5) !important;
          border-color: #ffd700 !important;
          backdrop-filter: blur(2px) !important;
          opacity: 0.7 !important;
          visibility: visible !important;
          color: white !important;
          font-weight: bold !important;
          pointer-events: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    waitForSocketIO() {
      // Check if Socket.IO is already loaded
      if (typeof io !== 'undefined') {
        debugLog('Socket.IO detected, connecting...');
        this.connect();
        return;
      }
      
      // Dynamically load Socket.IO from Mesulo CDN
      debugLog('Loading Socket.IO from Mesulo CDN...');
      
      const script = document.createElement('script');
      script.src = `${currentConfig.cdnUrl}/socket.io.min.js`;
      script.async = true;
      
      script.onload = () => {
        debugLog('Socket.IO loaded successfully, connecting...');
        this.connect();
      };
      
      script.onerror = () => {
        debugError('Failed to load Socket.IO from Mesulo CDN');
        debugError('Please check your internet connection or contact support');
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
        debugError('Socket.IO (io) is not defined. Cannot connect.');
        debugError('Socket.IO should have been auto-loaded from Mesulo CDN. Please check your internet connection.');
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
          debugLog('SDK connected to server');
          this.isConnected = true;
          this.updateStatus('connected');
          this.emit('connected');

          this.requestGames();
          
          // Wait 2 seconds before requesting games
          // setTimeout(() => {
            
          // }, 2000);
        });
        
        this.socket.on('disconnect', (reason) => {
          debugLog('SDK disconnected:', reason);
          this.isConnected = false;
          this.updateStatus('disconnected');
          this.emit('disconnected', { reason });
        });
        
        this.socket.on('connect_error', (error) => {
          debugError('SDK connection error:', error);
          this.updateStatus('disconnected');
          this.emit('error', { type: 'connection', error });
        });
        
        this.socket.on('games-updated', (data) => {
          debugLog('Received game update:', data);
          this.emit('game-updated', data);
          if (data.games) {
            this.updateSpecificGames(data.games);
          }
        });
        
        this.socket.on('games-response', (data) => {
          debugLog('Received initial games data');
          if (data.games) {
            this.updateSpecificGames(data.games);
          }
        });
        
      } catch (error) {
        debugError('Socket initialization error:', error);
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
          debugLog(`Scroll detected (${deltaY}px), deactivating video`);
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
    
    // Deactivate all videos (stop playing, hide button)
    deactivateAllVideos(hideButton = false, forceHideButton = false) {
      // Find all containers with video-active class (playing OR paused)
      const activeContainers = document.querySelectorAll('.game-card.video-active');
      activeContainers.forEach(container => {
        const videoElement = container.querySelector('video');
        if (videoElement) {
          videoElement.pause();
          videoElement.currentTime = 0;
          container.dataset.masuloVideoPlaying = 'false';
          
          // Hide button
          container.classList.remove('video-active');
        }
      });
    }
    
    requestGames() {
      // Get only tagged games (data-masulo-tag="true") for both initial load and real-time updates
      const taggedGameElements = document.querySelectorAll('[data-masulo-tag="true"]');
      const taggedGameIds = Array.from(taggedGameElements)
        .map(el => el.getAttribute('data-masulo-game-id'))
        .filter(Boolean);
      
      debugLog('Found tagged game elements:', taggedGameElements.length);
      debugLog('Game IDs to request:', taggedGameIds);
      
      if (taggedGameIds.length === 0) {
        debugLog('No tagged games found, skipping request');
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
      debugLog('Updating games with data:', gamesData);
      
      // 1. Find containers that need updates
      const containersToUpdate = [];
      
      gamesData.forEach(game => {
        // Check if this game exists on the page with data-masulo-tag="true"
        const container = document.querySelector(`[data-masulo-game-id="${game.id}"][data-masulo-tag="true"]`);
        
        if (!container) {
          debugLog(`No container found for game ${game.id}`);
          return;
        }
        
        debugLog(`Updating game ${game.id}:`, game);
        
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
        
        // Check if container has img element (needs conversion to video)
        const imgElement = container.querySelector('img');
        const videoElement = container.querySelector('video');
        
        // Always convert img to video, or update existing video if poster changed
        if (imgElement || (videoElement && videoElement.poster !== imageUrl)) {
          containersToUpdate.push({ container, game, imageUrl, videoUrl });
        }
      });
      
      if (containersToUpdate.length === 0) return;
      
      // 2. Show loaders
      containersToUpdate.forEach(({ container }) => {
        // Add loader element if it doesn't exist
        if (!container.querySelector('.loader')) {
          const loader = document.createElement('div');
          loader.className = 'loader';
          container.appendChild(loader);
        }
        container.classList.add('loading');
      });
      
      // 3. Wait 2 seconds for loader visibility
      setTimeout(() => {
        // 4. Start transitions
        containersToUpdate.forEach(({ container, game, imageUrl, videoUrl }) => {
          this.smoothReplaceWithVideo(container, imageUrl, videoUrl, game.id);
        });
      }, 2000);
    }
    
    smoothReplaceWithVideo(container, imageUrl, videoUrl, gameId) {
      const imgElement = container.querySelector('img');
      const existingVideoElement = container.querySelector('video');
      
      debugLog(`Starting smooth transition for ${gameId}`);
      
      // If container already has a video element, just update it
      if (existingVideoElement && !imgElement) {
        debugLog(`Video already exists for ${gameId}, updating poster and src`);
        
        // Remove loader
        container.classList.remove('loading');
        
        // Update existing video element
        if (imageUrl) {
          existingVideoElement.poster = imageUrl;
        }
        if (videoUrl) {
          existingVideoElement.src = videoUrl;
          existingVideoElement.load();
        } else {
          existingVideoElement.removeAttribute('src');
          existingVideoElement.load();
        }
        
        debugLog(`Completed video update for ${gameId}`);
        return;
      }
      
      // If no img element exists, nothing to do
      if (!imgElement) {
        debugLog(`No img element found for ${gameId}, skipping`);
        container.classList.remove('loading');
        return;
      }
      
      // Fade out current image
      container.classList.add('fading-out');
      
      // After fade out, replace with video
      setTimeout(() => {
        // Remove loader
        container.classList.remove('loading');
        
        // Create video with opacity 0
        const videoElement = document.createElement('video');
        videoElement.className = 'game-video';
        videoElement.muted = true;
        videoElement.loop = true;
        videoElement.playsInline = true;
        videoElement.preload = 'metadata';
        videoElement.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          pointer-events: none;
          display: block;
          opacity: 0;
        `;
        
        // Set poster and src
        if (imageUrl) {
          videoElement.poster = imageUrl;
        }
        if (videoUrl) {
          videoElement.src = videoUrl;
          videoElement.load();
        }
        
        // Replace img with video
        imgElement.parentNode.replaceChild(videoElement, imgElement);
        
        // Remove fading-out class
        container.classList.remove('fading-out');
        
        // Fade in video
        setTimeout(() => {
          videoElement.style.opacity = '1';
        }, 50);
        
        // Add event listeners
        this.addVideoEventListeners(container, videoElement, gameId);
        
        debugLog(`Completed smooth transition for ${gameId}`);
      }, 500); // Match CSS transition duration
    }
    
    addVideoEventListeners(container, videoElement, gameId) {
      const isTouchDevice = ('ontouchstart' in window && navigator.maxTouchPoints > 0) || 
                           (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Tablet'));
      
      if (isTouchDevice) {
        // Mobile: Touch to toggle video
        container.addEventListener('touchend', (e) => {
          // Don't trigger if tapping on a button
          if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
          }
          
          e.preventDefault();
          const isPlaying = container.dataset.masuloVideoPlaying === 'true';
          
          if (isPlaying) {
            // Just pause, don't reset
            this.pauseContainerVideo(container, videoElement, gameId);
          } else {
            this.playContainerVideo(container, videoElement, gameId);
          }
        }, { passive: false });
      } else {
        // Desktop: Hover to play video
        container.addEventListener('mouseenter', () => {
          this.playContainerVideo(container, videoElement, gameId);
        });
        
        container.addEventListener('mouseleave', () => {
          this.stopContainerVideo(container, videoElement, gameId);
        });
      }
      
      debugLog(`Added ${isTouchDevice ? 'touch' : 'hover'} event listeners for ${gameId}`);
    }
    
    playContainerVideo(container, videoElement, gameId) {
      debugLog(`Playing video for ${gameId}`);
      
      // Deactivate all other videos first
      this.deactivateAllVideos();
      
      // Show video and button
      videoElement.style.display = 'block';
      container.classList.add('video-active');
      
      // Play video
      videoElement.play().catch(err => {
        debugError(`Error playing video for ${gameId}:`, err);
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
    
    pauseContainerVideo(container, videoElement, gameId) {
      debugLog(`Pausing video for ${gameId}`);
      
      // Pause video but keep currentTime
      videoElement.pause();
      
      // Keep button visible (don't remove video-active class)
      // container.classList.remove('video-active'); // DON'T do this
      
      container.dataset.masuloVideoPlaying = 'false';
      
      // Track analytics if enabled
      if (this.analyticsEnabled) {
        this.trackAssetEvent('video_pause', gameId, 'video', videoElement.src, {
          trigger: 'tap',
          currentTime: videoElement.currentTime,
          viewport: this.getViewportInfo()
        });
      }
    }
    
    stopContainerVideo(container, videoElement, gameId) {
      debugLog(`Stopping video for ${gameId}`);
      
      // Stop and reset video
      videoElement.pause();
      videoElement.currentTime = 0;
      
      // Hide button
      container.classList.remove('video-active');
      
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
      
      // Update the video poster to default
      const videoElement = container.querySelector('video');
      if (videoElement && defaultImageUrl) {
        videoElement.poster = defaultImageUrl;
        videoElement.removeAttribute('src');
        videoElement.load();
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
          debugError('Error in event listener:', error);
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
    debugLog(`Found ${gameElements.length} masulo-game elements`);
    gameElements.forEach((element, index) => {
      debugLog(`Testing element ${index + 1}:`, element);
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