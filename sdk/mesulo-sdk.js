/**
 * Masulo Thumbnail SDK
 * Version: 1.0.1
 * Handles dynamic game image updates with beautiful transitions
 */
(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    development: {
      serverUrl: 'http://localhost:8080',
      cdnUrl: 'https://mesulo.b-cdn.net'
    },
    production: {
      serverUrl: 'https://www.mesulo.com',
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
      }
      
      .masulo-image-container img,
      .masulo-image-container .game-image {
        will-change: opacity;
        transition: opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        backface-visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
        transform: translateZ(0);
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
      
      injectStyles();
      this.init();
    }
    
    async init() {
      try {
        await this.loadSocketIO();
        this.connect();
      } catch (error) {
        console.error('Failed to initialize Masulo SDK:', error);
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
        console.log('Masulo SDK connected');
        this.updateStatus('connected');
        this.requestGames();
      });
      
      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('Masulo SDK disconnected');
        this.updateStatus('disconnected');
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Masulo SDK connection error:', error);
        this.updateStatus('disconnected');
      });
      
      this.socket.on('games-response', (response) => {
        if (response.success) {
          console.log(`Received ${response.count} games:`, response.games);
          response.games.forEach(game => {
            if (game.currentImage) {
              this.updateGameImage(game.id, game.currentImage);
            }
          });
        } else {
          console.error('Games request failed:', response.error);
        }
      });
    }
    
    requestGames() {
      const gameElements = document.querySelectorAll('[data-masulo-game-id][data-masulo-tag="true"]');
      const gameIds = Array.from(gameElements)
        .map(el => el.getAttribute('data-masulo-game-id'))
        .filter(Boolean);
      
      if (gameIds.length === 0) {
        console.warn('No games found with data-masulo-tag="true"');
        return;
      }
      
      console.log(`Requesting ${gameIds.length} tagged games:`, gameIds);
      this.socket.emit('sdk-event', {
        event: 'get-games',
        data: { gameIds },
        timestamp: new Date().toISOString()
      });
    }
    
    updateGameImage(gameId, imageUrl) {
      const container = document.querySelector(`[data-masulo-game-id="${gameId}"]`);
      if (!container) {
        console.warn(`No element found for game ID: ${gameId}`);
        return;
      }
      
      // Add container class for transitions
      container.classList.add('masulo-image-container');
      
      // Preload image
      const preloader = new Image();
      preloader.onload = () => this.applyImageTransition(container, imageUrl);
      preloader.onerror = () => console.error(`Failed to load image for game ${gameId}:`, imageUrl);
      preloader.src = imageUrl;
    }
    
    applyImageTransition(container, imageUrl) {
      // Show loader at bottom right over the old image
      container.classList.add('masulo-loading');
      
      // Wait a few seconds, then start the transition
      setTimeout(() => {
        // Start fade out of old image
        container.classList.add('masulo-fade-out');
        
        // Wait for fade out to complete, then replace image
        setTimeout(() => {
          // Find and update the image element
          const imgElement = container.querySelector('img') || 
                            container.querySelector('.game-image');
          
          if (imgElement && imgElement.tagName === 'IMG') {
            imgElement.src = imageUrl;
          } else if (container.style) {
            container.style.backgroundImage = `url(${imageUrl})`;
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
            }, 500);
          });
          
          console.log(`✓ Updated image: ${imageUrl}`);
        }, 300); // Wait for fade out to complete
      }, 3000); // Wait 3 seconds before starting transition
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