import { io } from 'socket.io-client';
import { getCurrentConfig } from './config.js';

export class ConnectionManager {
  constructor(applicationKey) {
    this.applicationKey = applicationKey;
    this.config = getCurrentConfig();
    this.isConnected = false;
    this.socket = null;
    this.eventListeners = new Map();
    this.statusCallbacks = [];
    this.currentStatus = null;
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
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.updateStatus('disconnected');
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      this.updateStatus('disconnected');
      this.emit('error', { type: 'connection', error });
    });

    this.socket.on('games-updated', (data) => {
      this.emit('game-updated', data);
    });

    this.socket.on('games-response', (data) => {
      this.emit('games-response', data);
    });

    this.socket.on('promotions-response', (data) => {
      this.emit('promotions-response', data);
    });

    this.socket.on('promotions-updated', (data) => {
      this.emit('promotions-updated', data);
    });

    this.socket.on('abtests-response', (data) => {
      this.emit('abtests-response', data);
    });

    this.socket.on('abtests-updated', (data) => {
      this.emit('abtests-updated', data);
    });

    this.socket.on('error', (error) => {
      this.emit('error', { type: 'socket', error });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.updateStatus('disconnected');
    }
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Error in event handler
        }
      });
    }
  }

  updateStatus(status) {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
    }
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        // Error in status callback
      }
    });
  }

  onStatusChange(callback) {
    this.statusCallbacks.push(callback);
  }

  getSocket() {
    return this.socket;
  }

  getApplicationKey() {
    return this.applicationKey;
  }

  getStatus() {
    return this.isConnected ? 'connected' : 'disconnected';
  }
}

let connectionManagerInstance = null;

export function getConnectionManager(applicationKey) {
  if (!connectionManagerInstance && applicationKey) {
    connectionManagerInstance = new ConnectionManager(applicationKey);
  }
  return connectionManagerInstance;
}

