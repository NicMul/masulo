/**
 * Connection Manager
 * Handles Socket.io connection and status management
 */

import { io } from 'socket.io-client';

export class ConnectionManager {
  constructor(config, applicationKey, statusCallbacks, emitCallback, onConnectedCallback) {
    this.config = config;
    this.applicationKey = applicationKey;
    this.statusCallbacks = statusCallbacks;
    this.emitCallback = emitCallback;
    this.onConnectedCallback = onConnectedCallback;
    
    this.isConnected = false;
    this.socket = null;
    this.onPromotionsRefreshCallback = null;
  }
  
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
      this.updateStatus('disconnected');
    }
  }
  
  setupSocketListeners() {
    // Connection established
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.updateStatus('connected');
      this.emitCallback('connected');
      
      // Notify that connection is ready (will trigger requestGames and rejoin rooms)
      if (this.onConnectedCallback) {
        this.onConnectedCallback();
      }
    });
    
    // Connection lost
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.updateStatus('disconnected');
      this.emitCallback('disconnected', { reason });
    });
    
    // Connection error
    this.socket.on('connect_error', (error) => {
      this.updateStatus('disconnected');
      this.emitCallback('error', { type: 'connection', error });
    });
    
    // Real-time game updates
    this.socket.on('games-updated', (data) => {
      this.emitCallback('game-updated', data);
      if (data.games && this.onGamesUpdateCallback) {
        this.onGamesUpdateCallback(data.games);
      }
    });
    
    // Initial game data response
    this.socket.on('games-response', (data) => {
      if (data.games && this.onGamesUpdateCallback) {
        this.onGamesUpdateCallback(data.games);
      }
    });
    
    // Promotions response
    this.socket.on('promotions-response', (data) => {
      console.log('[Mesulo SDK] Promotions response received:', data);
      if (data && data.promotions && this.onPromotionsUpdateCallback) {
        this.onPromotionsUpdateCallback(data.promotions);
      } else if (!data || !data.promotions) {
        console.log('[Mesulo SDK] Promotions response received but no promotions array found in data');
      }
    });
    
    // Real-time promotion updates - trigger refresh
    this.socket.on('promotions-updated', (data) => {
      console.log('[Mesulo SDK] Promotions updated - refreshing games and promotions');
      if (this.onPromotionsRefreshCallback) {
        this.onPromotionsRefreshCallback();
      }
    });
    
    // Listen for socket errors
    this.socket.on('error', (error) => {
      console.error('[Mesulo SDK] Socket error:', error);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  updateStatus(status) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        // Silently handle callback errors
      }
    });
  }
  
  getStatus() {
    return this.isConnected ? 'connected' : 'disconnected';
  }
  
  // Set callback for game updates
  setOnGamesUpdate(callback) {
    this.onGamesUpdateCallback = callback;
  }
  
  // Set callback for promotion updates
  setOnPromotionsUpdate(callback) {
    this.onPromotionsUpdateCallback = callback;
  }
  
  // Set callback for promotion refresh (re-fetch data)
  setOnPromotionsRefresh(callback) {
    this.onPromotionsRefreshCallback = callback;
  }
  
  // Get socket instance for other managers
  getSocket() {
    return this.socket;
  }
}

