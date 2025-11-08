/**
 * Mesulo SDK Core
 * Main SDK class that orchestrates all modules
 */

import { getCurrentConfig } from './config.js';
import { ConnectionManager } from './connection.js';
import { GameManager } from './game.js';
import { PromotionManager } from './promotions.js';
import { ABTestManager } from './abtest.js';
import { VideoManager } from './video.js';
import { ScrollDetector } from './scroll-detect.js';
import { AnalyticsManager } from './analytics.js';

export class MesuloSDK {
  constructor(config = {}) {
    // Core properties
    this.applicationKey = config.applicationKey;
    this.config = getCurrentConfig();
    
    // Event management
    this.eventListeners = {};
    this.statusCallbacks = [];
    
    // Status configuration
    this.statusConfig = {
      connectedText: config.connectedText || 'Connected',
      disconnectedText: config.disconnectedText || 'Disconnected',
      connectingText: config.connectingText || 'Connecting...',
      connectedClass: config.connectedClass || 'mesulo-connected',
      disconnectedClass: config.disconnectedClass || 'mesulo-disconnected',
      connectingClass: config.connectingClass || 'mesulo-connecting'
    };
    
    // Analytics setting
    const analyticsEnabled = config.analytics !== false;
    
    // Initialize managers
    this.connectionManager = new ConnectionManager(
      this.config,
      this.applicationKey,
      this.statusCallbacks,
      (event, data) => this.emit(event, data),
      () => {
        // Callback when connected - request games, promotions, and AB tests
        if (this.gameManager) {
          this.gameManager.requestGames();
        }
        this.requestPromotions();
        this.requestABTests();
      }
    );
    
    this.analyticsManager = new AnalyticsManager(
      this.connectionManager,
      null, // Will be set after gameManager is created
      analyticsEnabled
    );
    
    this.gameManager = new GameManager(
      this.connectionManager,
      this.analyticsManager
    );
    
    // Update analyticsManager with gameManager reference
    this.analyticsManager.gameManager = this.gameManager;
    
    this.promotionManager = new PromotionManager(
      this.connectionManager,
      this.gameManager
    );
    
    // Link PromotionManager to GameManager so it can check for active promotions
    this.gameManager.setPromotionManager(this.promotionManager);
    
    // Set up promotions callback
    this.connectionManager.setOnPromotionsUpdate((promotions) => {
      this.promotionManager.updatePromotions(promotions);
    });
    
    // Set up promotions refresh callback (for updates)
    this.connectionManager.setOnPromotionsRefresh(() => {
      this.gameManager.requestGames();
      this.requestPromotions();
    });
    
    this.abtestManager = new ABTestManager(
      this.connectionManager,
      this.gameManager
    );
    
    // Link ABTestManager to GameManager so it can check for active AB tests
    this.gameManager.setABTestManager(this.abtestManager);
    
    // Set up AB tests callback
    this.connectionManager.setOnABTestsUpdate((abtests) => {
      this.abtestManager.updateABTests(abtests);
    });
    
    // Set up AB tests refresh callback (for updates)
    this.connectionManager.setOnABTestsRefresh(() => {
      this.gameManager.requestGames();
      this.requestABTests();
    });
    
    this.videoManager = new VideoManager(this.gameManager);
    
    this.scrollDetector = new ScrollDetector(this.videoManager);
    
    // Auto-connect if application key provided
    if (this.applicationKey) {
      this.connect();
      this.setupScrollDetection();
    }
  }
  
  // ========== Connection Methods ==========
  
  connect() {
    this.connectionManager.connect();
  }
  
  disconnect() {
    this.connectionManager.disconnect();
  }
  
  // ========== Promotion Management ==========
  
  requestPromotions() {
    const socket = this.connectionManager.getSocket();
    if (!socket || !this.connectionManager.isConnected) {
      console.log('[Mesulo SDK] Cannot request promotions: socket not connected');
      return;
    }
    
    const requestData = {
      event: 'get-promotions',
      data: {},
      timestamp: new Date().toISOString()
    };
    
    console.log('[Mesulo SDK] Requesting promotions with:', requestData);
    // Request promotions
    socket.emit('sdk-event', requestData);
  }
  
  // ========== AB Test Management ==========
  
  requestABTests() {
    const socket = this.connectionManager.getSocket();
    if (!socket || !this.connectionManager.isConnected) {
      console.log('[Mesulo SDK] Cannot request AB tests: socket not connected');
      return;
    }
    
    const requestData = {
      event: 'get-ab-tests',
      data: {},
      timestamp: new Date().toISOString()
    };
    
    console.log('[Mesulo SDK] Requesting AB tests with:', requestData);
    // Request AB tests
    socket.emit('sdk-event', requestData);
  }
  
  // ========== Game Management ==========
  
  registerGameCard(component, gameId) {
    this.gameManager.registerGameCard(component, gameId);
  }
  
  unregisterGameCard(gameId, component) {
    this.gameManager.unregisterGameCard(gameId, component);
  }
  
  // ========== Video Management ==========
  
  deactivateAllVideos(resetToStart = true) {
    this.videoManager.deactivateAllVideos(resetToStart);
  }
  
  // ========== Scroll Detection ==========
  
  setupScrollDetection() {
    this.scrollDetector.setupScrollDetection();
  }
  
  // ========== Status Management ==========
  
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
        // Silently handle callback errors
      }
    });
  }
  
  // ========== Analytics ==========
  
  trackAssetEvent(eventType, gameId, assetType, assetUrl, metadata = {}, ignorePerGameSetting = false) {
    this.analyticsManager.trackAssetEvent(eventType, gameId, assetType, assetUrl, metadata, ignorePerGameSetting);
  }
  
  // ========== Getters for backward compatibility ==========
  
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
