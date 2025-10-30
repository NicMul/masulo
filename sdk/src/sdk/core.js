/**
 * Mesulo SDK Core
 * Main SDK class with Socket.io integration for real-time game updates
 */

import { io } from 'socket.io-client';
import { getCurrentConfig } from './config.js';

export class MesuloSDK {
  constructor(config = {}) {
    // Core properties
    this.applicationKey = config.applicationKey;
    this.isConnected = false;
    this.socket = null;
    this.config = getCurrentConfig();
    
    // Event management
    this.eventListeners = {};
    this.statusCallbacks = [];
    
    // Video management
    this.activeVideoContainer = null;
    this.registeredComponents = new Map(); // gameId -> Set<component>
    
    // Scroll detection
    this.isScrolling = false;
    this.scrollStartY = 0;
    this.SCROLL_THRESHOLD = 30;
    
    // Analytics
    this.analyticsEnabled = config.analytics !== false;
    this.sessionId = this.generateSessionId();
    
    // Status configuration
    this.statusConfig = {
      connectedText: config.connectedText || 'Connected',
      disconnectedText: config.disconnectedText || 'Disconnected',
      connectingText: config.connectingText || 'Connecting...',
      connectedClass: config.connectedClass || 'mesulo-connected',
      disconnectedClass: config.disconnectedClass || 'mesulo-disconnected',
      connectingClass: config.connectingClass || 'mesulo-connecting'
    };
    
    // Auto-connect if application key provided
    if (this.applicationKey) {
      this.connect();
      this.setupScrollDetection();
    }
  }
  
  // ========== Connection Methods ==========
  
  connect() {
    if (this.socket?.connected) {
      return;
    }
    
    this.updateStatus('connecting');
    
    try {
      this.socket = io(this.config.serverUrl, {
        auth: { applicationKey: this.applicationKey },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });
      
      this.setupSocketListeners();
      
    } catch (error) {
      console.error('[Mesulo SDK] Socket initialization error:', error);
      this.updateStatus('disconnected');
    }
  }
  
  setupSocketListeners() {
    // Connection established
    this.socket.on('connect', () => {
      console.log('[Mesulo SDK] : Connected 🚀');
      this.isConnected = true;
      this.updateStatus('connected');
      this.emit('connected');
      this.requestGames();
    });
    
    // Connection lost
    this.socket.on('disconnect', (reason) => {
      console.log('[Mesulo SDK] : Disconnected 😢');
      this.isConnected = false;
      this.updateStatus('disconnected');
      this.emit('disconnected', { reason });
    });
    
    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('[Mesulo SDK] Connection error:', error);
      this.updateStatus('disconnected');
      this.emit('error', { type: 'connection', error });
    });
    
    // Real-time game updates
    this.socket.on('games-updated', (data) => {
      this.emit('game-updated', data);
      if (data.games) {
        this.updateSpecificGames(data.games);
      }
    });
    
    // Initial game data response
    this.socket.on('games-response', (data) => {
      if (data.games) {
        this.updateSpecificGames(data.games);
      }
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  // ========== Game Management ==========
  
  registerGameCard(component, gameId) {
    const set = this.registeredComponents.get(gameId) || new Set();
    set.add(component);
    this.registeredComponents.set(gameId, set);
    
    // If already connected, request game data immediately
    if (this.isConnected) {
      this.requestGames();
    }
  }
  
  unregisterGameCard(gameId, component) {
    const set = this.registeredComponents.get(gameId);
    if (!set) return;
    if (component) {
      set.delete(component);
      if (set.size === 0) this.registeredComponents.delete(gameId);
    } else {
      this.registeredComponents.delete(gameId);
    }
  }
  
  requestGames() {
    if (!this.socket || !this.isConnected) {
      return;
    }
    
    const gameIds = Array.from(this.registeredComponents.keys());
    
    if (gameIds.length === 0) {
      return;
    }
    
    // Join game rooms for real-time updates
    this.socket.emit('join-game-rooms', {
      gameIds,
      timestamp: new Date().toISOString()
    });
    
    // Request initial game data
    this.socket.emit('sdk-event', {
      event: 'get-games',
      data: { gameIds },
      timestamp: new Date().toISOString()
    });
  }
  
  updateSpecificGames(gamesData) {
    gamesData.forEach(game => {
      const components = this.registeredComponents.get(game.id);
      if (!components || components.size === 0) {
        return;
      }

      // Determine which assets to use based on publishedType (once per game)
      let imageUrl = game.defaultImage;
      let videoUrl = game.defaultVideo;

      if (!game.published) {
        console.log('[Mesulo SDK] : Game unpublished', game);
        imageUrl = game.defaultImage;
        videoUrl = null;

        // Emit analytics once per game, include game_group
        this.trackAssetEvent(
          'game_unpublished',
          game.id,
          'defaultImage',
          imageUrl,
          {
            reason: 'game_unpublished',
            reverted_to: 'defaultImage',
            game_group: game.group ?? game.groupId ?? null
          },
          true
        );
      } else if (game.publishedType === 'current' && game.currentImage) {
        imageUrl = game.currentImage;
        videoUrl = game.currentVideo;
      } else if (game.publishedType === 'theme' && game.themeImage) {
        imageUrl = game.themeImage;
        videoUrl = game.themeVideo;
      } else if (game.publishedType === 'promo' && game.promoImage) {
        imageUrl = game.promoImage;
        videoUrl = game.promoVideo;
      }

      // Update all registered components for this game id
      components.forEach(component => {
        const container = component.getContainer ? component.getContainer() : component.container;
        if (!container) {
          return;
        }

        // Read current version from DOM
        // const currentVersionStr = container.getAttribute('data-mesulo-version');
        // const currentVersion = currentVersionStr ? parseInt(currentVersionStr, 10) : undefined;
        const newVersion = game.version;

        // If version exists in DOM and hasn't changed, skip the update for this element
        // if (currentVersion !== undefined && currentVersion === newVersion) {
        //   return;
        // }

        // Store version in DOM for persistence
        container.setAttribute('data-mesulo-version', String(newVersion));

        // Store analytics flag in DOM for persistence
        container.setAttribute('data-mesulo-analytics', String(game.analytics));

        // Apply update to this component
        if (typeof component.updateContent === 'function') {
          component.updateContent(imageUrl, videoUrl, game.published);
        }
      });
    });
  }
  
  // ========== Video Management ==========
  
  deactivateAllVideos(resetToStart = true) {
    // Deactivate all registered components, not just the active one
    this.registeredComponents.forEach(componentsSet => {
      if (!componentsSet) return;
      componentsSet.forEach(component => {
        if (typeof component?.deactivate === 'function') {
          component.deactivate(resetToStart);
        }
      });
    });

    this.activeVideoContainer = null;
  }
  
  // ========== Scroll Detection ==========
  
  setupScrollDetection() {
    let scrollTimeout;
    
    const handleTouchStart = (e) => {
      this.scrollStartY = e.touches[0].clientY;
      this.isScrolling = false;
    };
    
    const handleTouchMove = (e) => {
      if (!this.scrollStartY) return;
      
      const deltaY = Math.abs(e.touches[0].clientY - this.scrollStartY);
      
      if (deltaY > this.SCROLL_THRESHOLD && !this.isScrolling) {
        this.isScrolling = true;
        this.deactivateAllVideos(true); // Reset on scroll
      }
    };
    
    const handleTouchEnd = () => {
      this.scrollStartY = 0;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
      }, 100);
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }
  
  // ========== Status Management ==========
  
  updateStatus(status) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[Mesulo SDK] Error in status callback:', error);
      }
    });
  }
  
  onStatusChange(callback) {
    this.statusCallbacks.push(callback);
    callback(this.isConnected ? 'connected' : 'disconnected');
  }
  
  getStatus() {
    return this.isConnected ? 'connected' : 'disconnected';
  }
  
  // ========== Event System ==========
  
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  
  off(event, callback) {
    if (!this.eventListeners[event]) return;
    
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
    if (!this.eventListeners[event]) return;
    
    this.eventListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[Mesulo SDK] Error in event listener:', error);
      }
    });
  }
  
  // ========== Analytics ==========
  
  generateSessionId() {
    const existing = sessionStorage.getItem('mesulo_session_id');
    if (existing) return existing;
    
    const sessionId = 'mesulo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('mesulo_session_id', sessionId);
    return sessionId;
  }
  
  getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|phone/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
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
  
  trackAssetEvent(eventType, gameId, assetType, assetUrl, metadata = {}, ignorePerGameSetting = false) {
    // Check global analytics setting
    if (!this.analyticsEnabled || !this.isConnected || !this.socket) {
      return;
    }
    
    // Check per-game analytics setting from one of the containers unless ignored
    if (!ignorePerGameSetting) {
      const components = this.registeredComponents.get(gameId);
      let container = null;
      if (components && components.size > 0) {
        for (const comp of components.values()) {
          container = comp?.getContainer ? comp.getContainer() : comp?.container;
          if (container) break;
        }
      }
      const gameAnalyticsEnabled = container?.getAttribute('data-mesulo-analytics') !== 'false';
      if (!gameAnalyticsEnabled) {
        return;
      }
    }
    
    const eventData = {
      event_type: eventType,
      game_id: gameId,
      asset_type: assetType,
      asset_url: assetUrl,
      session_id: this.sessionId,
      game_group: metadata?.game_group ?? null,
      metadata: {
        ...this.getViewportInfo(),
        ...metadata
      }
    };
    
    this.socket.emit('analytics-event', eventData);
  }
}

