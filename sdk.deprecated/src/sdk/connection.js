

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
    this.onABTestsRefreshCallback = null;
    this.onABTestsUpdateCallback = null;
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
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.updateStatus('connected');
      this.emitCallback('connected');
      
      if (this.onConnectedCallback) {
        this.onConnectedCallback();
      }
    });
    
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.updateStatus('disconnected');
      this.emitCallback('disconnected', { reason });
    });
    
    this.socket.on('connect_error', (error) => {
      this.updateStatus('disconnected');
      this.emitCallback('error', { type: 'connection', error });
    });
    
    this.socket.on('games-updated', (data) => {
      this.emitCallback('game-updated', data);
      if (data.games && this.onGamesUpdateCallback) {
        this.onGamesUpdateCallback(data.games);
      }
    });
    
    this.socket.on('games-response', (data) => {
      if (data.games && this.onGamesUpdateCallback) {
        this.onGamesUpdateCallback(data.games);
      }
    });
    
    this.socket.on('promotions-response', (data) => {
      if (data && data.promotions && this.onPromotionsUpdateCallback) {
        this.onPromotionsUpdateCallback(data.promotions);
      }
    });
    
    this.socket.on('promotions-updated', (data) => {
      if (this.onPromotionsRefreshCallback) {
        this.onPromotionsRefreshCallback();
      }
    });
    
    this.socket.on('abtests-response', (data) => {
      if (data && data.abtests && this.onABTestsUpdateCallback) {
        this.onABTestsUpdateCallback(data.abtests);
      }
    });
    
    this.socket.on('abtests-updated', (data) => {
      if (data && data.abtests && this.onABTestsUpdateCallback) {
        this.onABTestsUpdateCallback(data.abtests);
      }
    });
    
    this.socket.on('error', (error) => {
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
      }
    });
  }
  
  getStatus() {
    return this.isConnected ? 'connected' : 'disconnected';
  }
  
  setOnGamesUpdate(callback) {
    this.onGamesUpdateCallback = callback;
  }
  
  setOnPromotionsUpdate(callback) {
    this.onPromotionsUpdateCallback = callback;
  }
  
  setOnPromotionsRefresh(callback) {
    this.onPromotionsRefreshCallback = callback;
  }
  
  setOnABTestsUpdate(callback) {
    this.onABTestsUpdateCallback = callback;
  }
  
  setOnABTestsRefresh(callback) {
    this.onABTestsRefreshCallback = callback;
  }
  
  getSocket() {
    return this.socket;
  }
  
  getApplicationKey() {
    return this.applicationKey;
  }
}

