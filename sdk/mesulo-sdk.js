/**
 * Masulo Thumbnail SDK
 * Version: 1.0.0
 */
(function() {
  'use strict';
  
  // Configuration
  const config = {
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
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost') ||
                       window.location.hostname.includes('127.0.0.1') ||
                       window.location.protocol === 'file:' ||
                       !window.location.hostname;
  const currentConfig = isDevelopment ? config.development : config.production;
  
  // Inject built-in CSS styles for connection status
  function injectStatusStyles() {
    if (document.getElementById('masulo-status-styles')) {
      return; // Already injected
    }
    
    const style = document.createElement('style');
    style.id = 'masulo-status-styles';
    style.textContent = `
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
    `;
    document.head.appendChild(style);
  }
  
  // Inject styles immediately
  injectStatusStyles();
  
  class MasuloSDK {
    constructor(options = {}) {
      this.applicationKey = options.applicationKey;
      this.socket = null;
      this.isConnected = false;
      this.socketIOLoaded = false;
      
      // Connection status management
      this.statusCallbacks = [];
      this.statusElements = [];
      this.statusConfig = {
        connectedText: 'Connected',
        disconnectedText: 'Disconnected',
        connectingText: 'Connecting...',
        connectedClass: 'masulo-connected',
        disconnectedClass: 'masulo-disconnected',
        connectingClass: 'masulo-connecting'
      };
      
      // Merge user config
      if (options.statusConfig) {
        this.statusConfig = { ...this.statusConfig, ...options.statusConfig };
      }
      
      if (!this.applicationKey) {
        throw new Error('ApplicationKey is required');
      }
      
      this.init();
    }
    
    init() {
      this.loadSocketIO().then(() => {
        this.connect();
      }).catch((error) => {
        console.error('Failed to load Socket.IO:', error);
      });
    }
    
    // Add connection status callback
    onStatusChange(callback) {
      this.statusCallbacks.push(callback);
      // Immediately call with current status
      callback(this.isConnected ? 'connected' : 'disconnected');
    }
    
    // Auto-update DOM elements with connection status
    updateStatusElements(selector) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        this.statusElements.push(element);
        this.updateElementStatus(element);
      });
    }
    
    // Update a single element's status
    updateElementStatus(element) {
      if (this.isConnected) {
        element.textContent = this.statusConfig.connectedText;
        element.className = element.className.replace(/masulo-(connected|disconnected|connecting)/g, '') + ' ' + this.statusConfig.connectedClass;
      } else {
        element.textContent = this.statusConfig.disconnectedText;
        element.className = element.className.replace(/masulo-(connected|disconnected|connecting)/g, '') + ' ' + this.statusConfig.disconnectedClass;
      }
    }
    
    // Notify all callbacks of status change
    notifyStatusChange(status) {
      this.statusCallbacks.forEach(callback => callback(status));
      this.statusElements.forEach(element => this.updateElementStatus(element));
    }
    
    loadSocketIO() {
      return new Promise((resolve, reject) => {
        if (window.io) {
          this.socketIOLoaded = true;
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        if (isDevelopment) {
          script.src = `${currentConfig.serverUrl}/socket.io/socket.io.js`;
        } else {
          script.src = `${currentConfig.cdnUrl}/socket.io.min.js`;
        }
        
        script.onload = () => {
          if (window.io) {
            this.socketIOLoaded = true;
            resolve();
          } else {
            reject(new Error('Socket.IO failed to load'));
          }
        };
        
        script.onerror = () => {
          console.error('Failed to load Socket.IO from:', script.src);
          reject(new Error('Failed to load Socket.IO script'));
        };
        
        document.head.appendChild(script);
      });
    }
    
    connect() {
      if (!this.socketIOLoaded) {
        console.error('Socket.IO not loaded yet');
        return;
      }
      
      // Update status to connecting
      this.notifyStatusChange('connecting');
      
      try {
        this.socket = io(currentConfig.serverUrl, {
          auth: {
            applicationKey: this.applicationKey
          },
          transports: ['websocket', 'polling']
        });
        
        this.socket.on('connect', () => {
          this.isConnected = true;
          console.log('Masulo SDK connected');
          this.notifyStatusChange('connected');
          // Automatically request games after connection
          this.requestGames();
        });
        
        this.socket.on('disconnect', () => {
          this.isConnected = false;
          console.log('Masulo SDK disconnected');
          this.notifyStatusChange('disconnected');
        });
        
        this.socket.on('connect_error', (error) => {
          console.error('Masulo SDK connection error:', error);
          this.notifyStatusChange('disconnected');
        });
        
        // Handle games response internally - clients don't need to do anything
        this.socket.on('games-response', (response) => {
          console.log('Games response received:', response);
          
          if (response.success) {
            console.log(`Found ${response.count} games:`, response.games);
          } else {
            console.error('Games request failed:', response.error);
          }
        });
        
      } catch (error) {
        console.error('Failed to create socket connection:', error);
        this.notifyStatusChange('disconnected');
      }
    }
    
    // Dynamically request games by scanning DOM for game elements
    requestGames() {
      const gameIds = [];
      
      // Search DOM for elements with both data-masulo-game-id and data-masulo-tag attributes
      const gameElements = document.querySelectorAll('[data-masulo-game-id][data-masulo-tag]');
      
      gameElements.forEach(element => {
        const gameId = element.getAttribute('data-masulo-game-id');
        const tagValue = element.getAttribute('data-masulo-tag');
        
        // Only add to array if data-masulo-tag is "true"
        if (tagValue === 'true' && gameId) {
          gameIds.push(gameId);
        }
      });
      
      console.log(`Found ${gameIds.length} tagged games in DOM:`, gameIds);
      
      if (gameIds.length === 0) {
        console.warn('No games found with data-masulo-tag="true" in DOM');
        return;
      }
      
      this.socket.emit('sdk-event', {
        event: 'get-games',
        data: { gameIds: gameIds },
        timestamp: new Date().toISOString()
      });
    }
    
    // Get current connection status
    getStatus() {
      return this.isConnected ? 'connected' : 'disconnected';
    }
  }
  
  // Expose to global scope
  window.MasuloSDK = MasuloSDK;
  
  // Auto-initialize if script has data attributes
  const script = document.currentScript;
  if (script && script.dataset.applicationKey) {
    window.masulo = new MasuloSDK({
      applicationKey: script.dataset.applicationKey
    });
  }
})();