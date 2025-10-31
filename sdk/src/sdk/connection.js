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
      this.emitCallback('connected');
      
      // Notify that connection is ready (will trigger requestGames)
      if (this.onConnectedCallback) {
        this.onConnectedCallback();
      }
    });
    
    // Connection lost
    this.socket.on('disconnect', (reason) => {
      console.log('[Mesulo SDK] : Disconnected 😢');
      this.isConnected = false;
      this.updateStatus('disconnected');
      this.emitCallback('disconnected', { reason });
    });
    
    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('[Mesulo SDK] Connection error:', error);
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
        console.error('[Mesulo SDK] Error in status callback:', error);
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
  
  // Get socket instance for other managers
  getSocket() {
    return this.socket;
  }
}

