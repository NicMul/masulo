

import { getCurrentConfig } from './config.js';
import { ConnectionManager } from './connection.js';
import { GameManager } from './game.js';
import { PromotionManager } from './promotions.js';
import { ABTestManager } from './abtest.js';
import { VideoManager } from './video.js';
import { ScrollDetector } from './scroll-detect.js';
import { BatchAnalytics } from './analytics/batch.analytics.js';
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
      (event, data) => {
        this.emit(event, data);
        // Flush analytics when connection is established
        if (event === 'connected' && this.analyticsManager) {
          this.analyticsManager.onConnectionEstablished();
        }
      },
      () => {
        if (this.gameManager) {
          this.gameManager.requestGames();
        }
        this.requestPromotions();
        this.requestABTests();
      }
    );
    
    this.analyticsManager = new BatchAnalytics(
      this.connectionManager,
      null, // Will be set after gameManager is created
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
      // Pass debug window reference to analytics manager
      if (this.analyticsManager) {
        this.analyticsManager.debugWindow = this.debugWindow;
        console.log('[SDK] Debug window set on analytics manager', { hasDebugWindow: !!this.analyticsManager.debugWindow, hasLogAnalytics: typeof this.analyticsManager.debugWindow?.logAnalytics === 'function' });
        // Test log to verify it's working
        if (typeof this.debugWindow.logAnalytics === 'function') {
          this.debugWindow.logAnalytics('info', 'Analytics debug logging initialized');
        }
      }
    }
    
    if (this.applicationKey) {
      this.connect();
      this.setupScrollDetection();
      
      // Set up global click tracking for analytics
      if (this.analyticsManager && typeof this.analyticsManager.setupGlobalClickTracking === 'function') {
        this.analyticsManager.setupGlobalClickTracking();
      }
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
  
  getViewportInfo() {
    return this.analyticsManager.getViewportInfo();
  }
}
