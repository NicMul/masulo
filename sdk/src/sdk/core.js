

import { getCurrentConfig } from './config.js';
import { ConnectionManager } from './connection.js';
import { GameManager } from './game.js';
import { PromotionManager } from './promotions.js';
import { ABTestManager } from './abtest.js';
import { VideoManager } from './video.js';
import { ScrollDetector } from './scroll-detect.js';
import { AnalyticsManager } from './analytics.js';
import { DebugWindow } from './debug-window.js';

export class MesuloSDK {
  constructor(config = {}) {
    this.applicationKey = config.applicationKey;
    this.config = getCurrentConfig();
    
    this.eventListeners = {};
    this.statusCallbacks = [];
    
    this.statusConfig = {
      connectedText: config.connectedText || 'Connected',
      disconnectedText: config.disconnectedText || 'Disconnected',
      connectingText: config.connectingText || 'Connecting...',
      connectedClass: config.connectedClass || 'mesulo-connected',
      disconnectedClass: config.disconnectedClass || 'mesulo-disconnected',
      connectingClass: config.connectingClass || 'mesulo-connecting'
    };
    
    const analyticsEnabled = config.analytics !== false;
    
    this.connectionManager = new ConnectionManager(
      this.config,
      this.applicationKey,
      this.statusCallbacks,
      (event, data) => this.emit(event, data),
      () => {
        if (this.gameManager) {
          this.gameManager.requestGames();
        }
        this.requestPromotions();
        this.requestABTests();
      }
    );
    
    this.analyticsManager = new AnalyticsManager(
      this.connectionManager,
      null,
      analyticsEnabled
    );
    
    this.gameManager = new GameManager(
      this.connectionManager,
      this.analyticsManager
    );
    
    this.analyticsManager.gameManager = this.gameManager;
    
    this.promotionManager = new PromotionManager(
      this.connectionManager,
      this.gameManager
    );
    
    this.gameManager.setPromotionManager(this.promotionManager);
    
    this.connectionManager.setOnPromotionsUpdate((promotions) => {
      this.promotionManager.updatePromotions(promotions);
    });
    
    this.connectionManager.setOnPromotionsRefresh(() => {
      this.gameManager.requestGames();
      this.requestPromotions();
    });
    
    this.abtestManager = new ABTestManager(
      this.connectionManager,
      this.gameManager
    );
    
    this.gameManager.setABTestManager(this.abtestManager);
    
    this.connectionManager.setOnABTestsUpdate((abtests) => {
      this.abtestManager.updateABTests(abtests);
    });
    
    this.connectionManager.setOnABTestsRefresh(() => {
      this.gameManager.requestGames();
      this.requestABTests();
    });
    
    this.videoManager = new VideoManager(this.gameManager);
    
    this.scrollDetector = new ScrollDetector(this.videoManager);
    
    // Initialize debug window if enabled
    if (config.debug === true) {
      this.debugWindow = new DebugWindow(this);
    }
    
    if (this.applicationKey) {
      this.connect();
      this.setupScrollDetection();
    }
  }
  
  connect() {
    this.connectionManager.connect();
  }
  
  disconnect() {
    this.connectionManager.disconnect();
  }
  
  requestPromotions() {
    const socket = this.connectionManager.getSocket();
    if (!socket || !this.connectionManager.isConnected) {
      return;
    }
    
    const requestData = {
      event: 'get-promotions',
      data: {},
      timestamp: new Date().toISOString()
    };
    
    socket.emit('sdk-event', requestData);
  }
  
  requestABTests() {
    const socket = this.connectionManager.getSocket();
    if (!socket || !this.connectionManager.isConnected) {
      return;
    }
    
    const requestData = {
      event: 'get-ab-tests',
      data: {},
      timestamp: new Date().toISOString()
    };
    
    socket.emit('sdk-event', requestData);
  }
  
  registerGameCard(component, gameId) {
    this.gameManager.registerGameCard(component, gameId);
  }
  
  unregisterGameCard(gameId, component) {
    this.gameManager.unregisterGameCard(gameId, component);
  }
  
  deactivateAllVideos(resetToStart = true) {
    this.videoManager.deactivateAllVideos(resetToStart);
  }
  
  setupScrollDetection() {
    this.scrollDetector.setupScrollDetection();
  }
  
  updateStatus(status) {
    this.connectionManager.updateStatus(status);
  }
  
  onStatusChange(callback) {
    this.statusCallbacks.push(callback);
    callback(this.connectionManager.isConnected ? 'connected' : 'disconnected');
  }
  
  getStatus() {
    return this.connectionManager.getStatus();
  }
  
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
      }
    });
  }
  
  trackAssetEvent(eventType, gameId, assetType, assetUrl, metadata = {}, ignorePerGameSetting = false) {
    this.analyticsManager.trackAssetEvent(eventType, gameId, assetType, assetUrl, metadata, ignorePerGameSetting);
  }
  
  get isConnected() {
    return this.connectionManager.isConnected;
  }
  
  get socket() {
    return this.connectionManager.getSocket();
  }
  
  get registeredComponents() {
    return this.gameManager.getRegisteredComponents();
  }
  
  get activeVideoContainer() {
    return this.videoManager.activeVideoContainer;
  }
  
  set activeVideoContainer(value) {
    this.videoManager.activeVideoContainer = value;
  }
  
  get analyticsEnabled() {
    return this.analyticsManager.analyticsEnabled;
  }
  
  get sessionId() {
    return this.analyticsManager.sessionId;
  }
}
