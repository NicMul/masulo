/**
 * Masulo Thumbnail SDK
 * Version: 1.0.2
 * Handles dynamic game image updates with beautiful transitions
 */
(function() {
  'use strict';
  
  // // Configuration
  // const CONFIG = {
  //   development: {
  //     serverUrl: 'http://localhost:8080',
  //     cdnUrl: 'https://mesulo.b-cdn.net'
  //   },
  //   production: {
  //     serverUrl: 'https://www.mesulo.com',
  //     cdnUrl: 'https://mesulo.b-cdn.net'
  //   }
  // };

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
  
  // Inject all required styles once
  function injectStyles() {
    if (document.getElementById('masulo-sdk-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'masulo-sdk-styles';
    style.textContent = `
      /* Connection Status Styles */
      .masulo-connected {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      .masulo-disconnected {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      .masulo-connecting {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }
      
      /* Image Transition Styles - Optimized for smoothness */
      .masulo-image-container {
        position: relative;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
      }
      
      .masulo-image-container img,
      .masulo-image-container .game-image {
        will-change: opacity;
        transition: opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        backface-visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
        transform: translateZ(0);
        width: 100%;
        height: 100%;
        object-fit: cover;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        pointer-events: none;
      }
      
      /* Show loader over old image (old image stays visible) */
      .masulo-image-container.masulo-loading img,
      .masulo-image-container.masulo-loading .game-image {
        opacity: 1; /* Keep old image visible while loader shows */
      }
      
      /* Fade out old image during transition */
      .masulo-image-container.masulo-fade-out img,
      .masulo-image-container.masulo-fade-out .game-image {
        opacity: 0;
      }
      
      /* Fade in new image */
      .masulo-image-container.masulo-loaded img,
      .masulo-image-container.masulo-loaded .game-image {
        opacity: 1;
      }
      
      /* Loader positioned at bottom right */
      .masulo-image-container::after {
        content: '';
        position: absolute !important;
        bottom: 10px !important;
        right: 10px !important;
        top: auto !important;
        left: auto !important;
        width: 16px;
        height: 16px;
        
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 10;
        
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='12' r='10' stroke='white' stroke-width='2' stroke-linecap='round' stroke-dasharray='30 10' opacity='0.6'/%3E%3C/svg%3E");
        background-size: contain;
        background-repeat: no-repeat;
        animation: masulo-spin 1s linear infinite;
      }
      
      .masulo-image-container.masulo-loading::after {
        opacity: 1;
      }
      
      @keyframes masulo-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Video styling */
      .masulo-game-video {
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
      
      /* Style existing play buttons - hidden initially */
      .masulo-image-container .masulo-play-button {
        transition: all 0.3s ease !important;
        backdrop-filter: blur(0px) !important;
        opacity: 0 !important;
        visibility: hidden !important;
        display: block !important;
        pointer-events: none !important;
      }
      
      /* Active state - show translucent and blurred button */
      .masulo-image-container:hover .masulo-play-button,
      .masulo-image-container.masulo-video-active .masulo-play-button {
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
  
  class MasuloSDK {
    constructor(options = {}) {
      this.applicationKey = options.applicationKey;
      if (!this.applicationKey) {
        throw new Error('ApplicationKey is required');
      }
      
      this.socket = null;
      this.isConnected = false;
      this.statusCallbacks = [];
      this.statusElements = [];
      this.statusConfig = {
        connectedText: 'Connected',
        disconnectedText: 'Disconnected',
        connectingText: 'Connecting...',
        connectedClass: 'masulo-connected',
        disconnectedClass: 'masulo-disconnected',
        connectingClass: 'masulo-connecting',
        ...options.statusConfig
      };
      
      // Analytics tracking properties
      this.sessionId = this.generateSessionId();
      this.analyticsEnabled = options.analyticsEnabled !== false; // Default to true
      this.trackingData = new Map(); // Store tracking data for cleanup
      
      // Track active video container globally
      this.activeVideoContainer = null;
      
      // Track scroll state
      this.scrollStartY = 0;
      this.isScrolling = false;
      
      injectStyles();
      this.init();
      this.setupGlobalScrollDetection();
    }
    
    async init() {
      try {
        await this.loadSocketIO();
        this.connect();
      } catch (error) {
        // Failed to initialize Masulo SDK
      }
    }
    
    loadSocketIO() {
      return new Promise((resolve, reject) => {
        if (window.io) {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.src = isDevelopment 
          ? `${currentConfig.serverUrl}/socket.io/socket.io.js`
          : `${currentConfig.cdnUrl}/socket.io.min.js`;
        
        script.onload = () => window.io ? resolve() : reject(new Error('Socket.IO failed to load'));
        script.onerror = () => reject(new Error('Failed to load Socket.IO script'));
        
        document.head.appendChild(script);
      });
    }
    
    connect() {
      this.updateStatus('connecting');
      
      this.socket = io(currentConfig.serverUrl, {
        auth: { applicationKey: this.applicationKey },
        transports: ['websocket', 'polling']
      });
      
      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('🚀 Mesulo Ai connected!');
        this.updateStatus('connected');
        this.emit('connected');
        this.requestGames();
      });
      
      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.updateStatus('disconnected');
        this.emit('disconnected');
      });
      
      this.socket.on('connect_error', (error) => {
        this.updateStatus('disconnected');
        this.emit('error', error);
      });
      
       this.socket.on('games-response', (response) => {
         if (response.success) {
           this.updateSpecificGames(response.games);
         } else {
           // Games request failed
         }
       });

       this.socket.on('games-updated', (response) => {
         if (response.success) {
           this.updateSpecificGames(response.games);
         } else {
           // Game update failed
         }
       });
    }
    
    // Global scroll detection to deactivate videos when scrolling >30px
    setupGlobalScrollDetection() {
      let scrollTimeout;
      
      const handleTouchStart = (e) => {
        this.scrollStartY = e.touches[0].clientY;
        this.isScrolling = false;
      };
      
      const handleTouchMove = (e) => {
        const currentY = e.touches[0].clientY;
        const scrollDistance = Math.abs(currentY - this.scrollStartY);
        
        // If scrolled more than 30px, deactivate all videos
        if (scrollDistance > 30 && !this.isScrolling) {
          this.isScrolling = true;
          this.deactivateAllVideos();
        }
      };
      
      const handleTouchEnd = () => {
        // Reset scroll tracking after a short delay
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
    
    // Deactivate all videos (stop playing, hide button/CSS)
    deactivateAllVideos() {
      if (this.activeVideoContainer) {
        const container = this.activeVideoContainer;
        const videoElement = container.querySelector('video');
        const imgElement = container.querySelector('img') || container.querySelector('.game-image');
        
        if (videoElement) {
          videoElement.pause();
          videoElement.currentTime = 0;
          videoElement.style.display = 'none';
        }
        
        if (imgElement) {
          imgElement.style.display = 'block';
        }
        
        container.classList.remove('masulo-video-active');
        container._masuloIsPlaying = false;
        this.activeVideoContainer = null;
      }
    }
    
    requestGames() {
      // Get only tagged games (data-masulo-tag="true") for both initial load and real-time updates
      const taggedGameElements = document.querySelectorAll('[data-masulo-game-id][data-masulo-tag="true"]');
      const taggedGameIds = Array.from(taggedGameElements)
        .map(el => el.getAttribute('data-masulo-game-id'))
        .filter(Boolean);
      
      if (taggedGameIds.length === 0) {
        return;
      }
      
      // Found tagged games for updates
      
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
      gamesData.forEach(game => {
        // Check if this game exists on the page with data-masulo-tag="true"
        // Only update games that are explicitly tagged for updates
        const container = document.querySelector(`[data-masulo-game-id="${game.id}"][data-masulo-tag="true"]`);
        
        if (!container) {
          return;
        }
        
        // If game is not published, revert to defaultImage only (no video)
        if (!game.published) {
          this.revertGameToDefault(game.id, game.defaultImage);
          return;
        }
        
        // Updating game
        
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
        
        // Update the game image using existing method
        this.updateGameImage(game.id, imageUrl, videoUrl, game.publishedType);
      });
    }
    
    revertGameToDefault(gameId, defaultImageUrl) {
      const container = document.querySelector(`[data-masulo-game-id="${gameId}"]`);
      if (!container) {
        return;
      }
      
      // Remove all existing analytics tracking
      this.removeAssetTracking(container);
      
      // Track game unpublish event
      this.trackAssetEvent('game_unpublished', gameId, 'defaultImage', defaultImageUrl, {
        reason: 'game_unpublished',
        reverted_to: 'defaultImage'
      });
      
      // Remove loading/transition classes
      container.classList.remove('masulo-loading', 'masulo-fade-out', 'masulo-loaded', 'masulo-video-active');
      
      // Find and update the image element to defaultImage only
      const imgElement = container.querySelector('img') || 
                        container.querySelector('.game-image');
      
      if (imgElement && imgElement.tagName === 'IMG') {
        imgElement.src = defaultImageUrl;
        imgElement.style.display = 'block';
      } else if (container.style) {
        container.style.backgroundImage = `url(${defaultImageUrl})`;
      }
      
      // Remove video element if it exists
      const videoElement = container.querySelector('video');
      if (videoElement) {
        videoElement.pause();
        videoElement.style.display = 'none';
        videoElement.src = '';
      }
      
      // Remove video event listeners
      if (container._masuloMouseEnter) {
        container.removeEventListener('mouseenter', container._masuloMouseEnter);
        container._masuloMouseEnter = null;
      }
      if (container._masuloMouseLeave) {
        container.removeEventListener('mouseleave', container._masuloMouseLeave);
        container._masuloMouseLeave = null;
      }
      if (container._masuloTouchHandler) {
        container.removeEventListener('touchend', container._masuloTouchHandler);
        container._masuloTouchHandler = null;
      }
      if (container._masuloContextMenu) {
        container.removeEventListener('contextmenu', container._masuloContextMenu);
        container._masuloContextMenu = null;
      }
      
      // Reset state
      container._masuloIsPlaying = false;
      if (this.activeVideoContainer === container) {
        this.activeVideoContainer = null;
      }
      
      // Set up tracking for default image only
      this.setupAssetTracking(container, gameId, 'defaultImage', defaultImageUrl);
      
      // Reverted game to defaultImage
    }
    
    updateGameImage(gameId, imageUrl, videoUrl = null, publishedType = 'default') {
      const container = document.querySelector(`[data-masulo-game-id="${gameId}"]`);
      if (!container) {
        return;
      }
      
      // Remove existing tracking before updating
      this.removeAssetTracking(container);
      
      // Add container class for transitions
      container.classList.add('masulo-image-container');
      
      // Style existing play button if it exists - apply immediately
      const existingPlayButton = container.querySelector('button, .play-button, .cta-button, [class*="play"], [class*="cta"]');
      if (existingPlayButton) {
        existingPlayButton.classList.add('masulo-play-button');
      }
      
      // Preload image
      const preloader = new Image();
      preloader.onload = () => {
        if (videoUrl) {
          // Preload video metadata
          const videoPreloader = document.createElement('video');
          videoPreloader.preload = 'metadata';
          videoPreloader.onloadedmetadata = () => {
            this.applyImageTransition(container, imageUrl, videoUrl, publishedType);
          };
          videoPreloader.onerror = () => {
            this.applyImageTransition(container, imageUrl, null, publishedType);
          };
          videoPreloader.src = videoUrl;
        } else {
          this.applyImageTransition(container, imageUrl, null, publishedType);
        }
      };
      preloader.onerror = () => {
        // Failed to load image
      };
      preloader.src = imageUrl;
    }
    
    applyImageTransition(container, imageUrl, videoUrl, publishedType) {
      // Show loader immediately
      container.classList.add('masulo-loading');
      
      // Wait 3 seconds before showing the loader
      setTimeout(() => {
        // Start fade out
        container.classList.add('masulo-fade-out');
        
        // Wait for fade out to complete, then swap images
        setTimeout(() => {
          // Find the image element
          const imgElement = container.querySelector('img') || 
                            container.querySelector('.game-image');
          
          // Update the image
          if (imgElement && imgElement.tagName === 'IMG') {
            imgElement.src = imageUrl;
            imgElement.style.display = 'block';
          } else if (container.style) {
            container.style.backgroundImage = `url(${imageUrl})`;
          }
          
          // Add video element if video URL exists
          if (videoUrl) {
            let videoElement = container.querySelector('video');
            if (!videoElement) {
              videoElement = document.createElement('video');
              videoElement.classList.add('masulo-game-video');
              videoElement.muted = true;
              videoElement.loop = true;
              videoElement.playsInline = true;
              videoElement.preload = 'metadata';
              container.appendChild(videoElement);
            }
            videoElement.src = videoUrl;
            videoElement.style.display = 'none';
            
            // Style existing play button if it exists
            const existingPlayButton = container.querySelector('button, .play-button, .cta-button, [class*="play"], [class*="cta"]');
            if (existingPlayButton) {
              existingPlayButton.classList.add('masulo-play-button');
            }
            
            // Add tap-to-toggle functionality
            this.addVideoTapToggle(container, imgElement, videoElement);
          }
          
          // Force reflow to ensure image is loaded
          void container.offsetHeight;
          
          // Start fade in of new image
          requestAnimationFrame(() => {
            container.classList.remove('masulo-loading', 'masulo-fade-out');
            container.classList.add('masulo-loaded');
            
            // Clean up after transition completes
            setTimeout(() => {
              container.classList.remove('masulo-loaded');
              
              // Set up analytics tracking after transition completes
              const gameId = container.getAttribute('data-masulo-game-id');
              if (gameId) {
                // Determine asset type based on publishedType
                let imageAssetType = publishedType + 'Image';
                let videoAssetType = publishedType + 'Video';
                
                // Set up tracking for both image and video if present
                this.setupAssetTracking(container, gameId, imageAssetType, imageUrl);
                if (videoUrl) {
                  this.setupAssetTracking(container, gameId, videoAssetType, videoUrl);
                }
              }
            }, 500);
          });
          
          // Updated image and video
        }, 300); // Wait for fade out to complete
      }, 3000); // Wait 3 seconds before starting transition
    }
    
    // Add tap-to-toggle video functionality
    addVideoTapToggle(container, imgElement, videoElement) {
      // Remove existing event listeners to prevent duplicates
      if (container._masuloMouseEnter) {
        container.removeEventListener('mouseenter', container._masuloMouseEnter);
        container._masuloMouseEnter = null;
      }
      if (container._masuloMouseLeave) {
        container.removeEventListener('mouseleave', container._masuloMouseLeave);
        container._masuloMouseLeave = null;
      }
      if (container._masuloTouchHandler) {
        container.removeEventListener('touchend', container._masuloTouchHandler);
        container._masuloTouchHandler = null;
      }
      if (container._masuloContextMenu) {
        container.removeEventListener('contextmenu', container._masuloContextMenu);
        container._masuloContextMenu = null;
      }
      
      // Desktop: Mouse enter - show video
      container._masuloMouseEnter = () => {
        imgElement.style.display = 'none';
        videoElement.style.display = 'block';
        videoElement.play().catch(e => {
          // Video autoplay failed
        });
      };
      
      // Desktop: Mouse leave - show image
      container._masuloMouseLeave = () => {
        videoElement.pause();
        videoElement.currentTime = 0;
        videoElement.style.display = 'none';
        imgElement.style.display = 'block';
      };
      
      // Mobile: Tap to toggle
      container._masuloTouchHandler = (e) => {
        // Check if tap was on the button - if so, let it navigate (don't toggle video)
        const button = container.querySelector('.masulo-play-button');
        if (button && e.target === button) {
          // Button click - let it navigate, don't prevent default
          return;
        }
        
        // Prevent default to avoid unwanted behaviors
        e.preventDefault();
        
        // If this container is already active
        if (container._masuloIsPlaying) {
          // Toggle: stop video if playing, play if paused
          if (!videoElement.paused) {
            videoElement.pause();
          } else {
            videoElement.play().catch(err => {
              // Video play failed
            });
          }
        } else {
          // New video clicked - deactivate all others first
          this.deactivateAllVideos();
          
          // Activate this video
          container._masuloIsPlaying = true;
          this.activeVideoContainer = container;
          container.classList.add('masulo-video-active');
          imgElement.style.display = 'none';
          videoElement.style.display = 'block';
          videoElement.play().catch(e => {
            // Video autoplay failed
          });
        }
      };
      
      // Prevent context menu on images and videos
      container._masuloContextMenu = (e) => {
        e.preventDefault();
        return false;
      };
      
      // Initialize state
      container._masuloIsPlaying = false;
      
      // Add event listeners
      container.addEventListener('mouseenter', container._masuloMouseEnter);
      container.addEventListener('mouseleave', container._masuloMouseLeave);
      container.addEventListener('touchend', container._masuloTouchHandler, { passive: false });
      container.addEventListener('contextmenu', container._masuloContextMenu);
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
          // Error in event listener
        }
      });
    }

    // Analytics Methods
    
    generateSessionId() {
      // Try to get existing session from sessionStorage
      const existingSession = sessionStorage.getItem('masulo_session_id');
      if (existingSession) {
        return existingSession;
      }
      
      // Generate new session ID
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

    removeAssetTracking(container) {
      if (!container || !this.trackingData.has(container)) {
        return;
      }

      const trackingInfo = this.trackingData.get(container);
      
      // Remove all event listeners
      if (trackingInfo.listeners) {
        trackingInfo.listeners.forEach(({ element, event, handler }) => {
          element.removeEventListener(event, handler);
        });
      }

      // Clear tracking data
      this.trackingData.delete(container);
    }

    setupAssetTracking(container, gameId, assetType, assetUrl) {
      if (!this.analyticsEnabled || !container) {
        return;
      }

      // Remove existing tracking first
      this.removeAssetTracking(container);

      const listeners = [];
      const trackingInfo = {
        gameId,
        assetType,
        assetUrl,
        listeners
      };

      // Get asset elements
      const imgElement = container.querySelector('img') || container.querySelector('.game-image');
      const videoElement = container.querySelector('video');
      const playButton = container.querySelector('button, .play-button, .cta-button, [class*="play"], [class*="cta"]');

      // Image hover tracking (debounced)
      if (imgElement) {
        let hoverStartTime = null;

        const handleMouseEnter = () => {
          hoverStartTime = Date.now();
          this.trackAssetEvent('hover', gameId, assetType, assetUrl, {
            hover_start: hoverStartTime
          });
        };

        const handleMouseLeave = () => {
          if (hoverStartTime) {
            const hoverDuration = Date.now() - hoverStartTime;
            this.trackAssetEvent('hover', gameId, assetType, assetUrl, {
              hover_duration: hoverDuration,
              hover_end: Date.now()
            });
            hoverStartTime = null;
          }
        };

        imgElement.addEventListener('mouseenter', handleMouseEnter);
        imgElement.addEventListener('mouseleave', handleMouseLeave);
        listeners.push({ element: imgElement, event: 'mouseenter', handler: handleMouseEnter });
        listeners.push({ element: imgElement, event: 'mouseleave', handler: handleMouseLeave });
      }

      // Image click tracking
      if (imgElement) {
        const handleClick = (e) => {
          this.trackAssetEvent('click', gameId, assetType, assetUrl, {
            click_x: e.clientX,
            click_y: e.clientY,
            click_target: e.target.tagName
          });
        };

        imgElement.addEventListener('click', handleClick);
        listeners.push({ element: imgElement, event: 'click', handler: handleClick });
      }

      // Touch events (mobile)
      if (imgElement) {
        const handleTouchStart = (e) => {
          this.trackAssetEvent('touch', gameId, assetType, assetUrl, {
            touch_start: Date.now(),
            touch_x: e.touches[0].clientX,
            touch_y: e.touches[0].clientY
          });
        };

        const handleTouchEnd = (e) => {
          this.trackAssetEvent('touch', gameId, assetType, assetUrl, {
            touch_end: Date.now(),
            touch_x: e.changedTouches[0].clientX,
            touch_y: e.changedTouches[0].clientY
          });
        };

        imgElement.addEventListener('touchstart', handleTouchStart);
        imgElement.addEventListener('touchend', handleTouchEnd);
        listeners.push({ element: imgElement, event: 'touchstart', handler: handleTouchStart });
        listeners.push({ element: imgElement, event: 'touchend', handler: handleTouchEnd });
      }

      // Video tracking
      if (videoElement) {
        const handlePlay = () => {
          this.trackAssetEvent('video_play', gameId, assetType, assetUrl, {
            video_current_time: videoElement.currentTime,
            video_duration: videoElement.duration
          });
        };

        const handlePause = () => {
          this.trackAssetEvent('video_pause', gameId, assetType, assetUrl, {
            video_current_time: videoElement.currentTime,
            video_duration: videoElement.duration
          });
        };

        const handleEnded = () => {
          this.trackAssetEvent('video_ended', gameId, assetType, assetUrl, {
            video_duration: videoElement.duration
          });
        };

        const handleMouseEnter = () => {
          this.trackAssetEvent('video_hover', gameId, assetType, assetUrl, {
            video_hover_start: Date.now()
          });
        };

        const handleMouseLeave = () => {
          this.trackAssetEvent('video_hover', gameId, assetType, assetUrl, {
            video_hover_end: Date.now()
          });
        };

        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);
        videoElement.addEventListener('ended', handleEnded);
        videoElement.addEventListener('mouseenter', handleMouseEnter);
        videoElement.addEventListener('mouseleave', handleMouseLeave);
        
        listeners.push({ element: videoElement, event: 'play', handler: handlePlay });
        listeners.push({ element: videoElement, event: 'pause', handler: handlePause });
        listeners.push({ element: videoElement, event: 'ended', handler: handleEnded });
        listeners.push({ element: videoElement, event: 'mouseenter', handler: handleMouseEnter });
        listeners.push({ element: videoElement, event: 'mouseleave', handler: handleMouseLeave });
      }

      // Play button tracking
      if (playButton) {
        const handleClick = (e) => {
          this.trackAssetEvent('click', gameId, assetType, assetUrl, {
            click_x: e.clientX,
            click_y: e.clientY,
            click_target: 'play_button',
            button_text: playButton.textContent || playButton.innerText
          });
        };

        playButton.addEventListener('click', handleClick);
        listeners.push({ element: playButton, event: 'click', handler: handleClick });
      }

      // Store tracking info for cleanup
      this.trackingData.set(container, trackingInfo);
    }
  }
  
  // Expose to global scope
  window.MasuloSDK = MasuloSDK;
  
  // Auto-initialize from script tag
  const script = document.currentScript;
  if (script?.dataset.applicationKey) {
    window.masulo = new MasuloSDK({
      applicationKey: script.dataset.applicationKey
    });
  }
})();