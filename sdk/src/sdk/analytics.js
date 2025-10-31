/**
 * Analytics Manager
 * Handles analytics tracking and session management
 */

export class AnalyticsManager {
  constructor(connectionManager, gameManager, analyticsEnabled) {
    this.connectionManager = connectionManager;
    this.gameManager = gameManager;
    this.analyticsEnabled = analyticsEnabled;
    this.sessionId = this.generateSessionId();
  }
  
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
    if (!this.analyticsEnabled || !this.connectionManager.isConnected) {
      return;
    }
    
    const socket = this.connectionManager.getSocket();
    if (!socket) {
      return;
    }
    
    // Check per-game analytics setting from one of the containers unless ignored
    if (!ignorePerGameSetting) {
      const registeredComponents = this.gameManager.getRegisteredComponents();
      const components = registeredComponents.get(gameId);
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
    
    socket.emit('analytics-event', eventData);
  }
}

