

import { BatchAnalytics } from './analytics/batch.analytics.js';

export class AnalyticsManager {
  constructor(connectionManager, gameManager, analyticsEnabled) {
    // Delegate to BatchAnalytics
    this.batchAnalytics = new BatchAnalytics(connectionManager, gameManager, analyticsEnabled);
  }
  
  get analyticsEnabled() {
    return this.batchAnalytics.analyticsEnabled;
  }
  
  get sessionId() {
    return this.batchAnalytics.sessionId;
  }
  
  get gameManager() {
    return this.batchAnalytics.gameManager;
  }
  
  set gameManager(value) {
    this.batchAnalytics.gameManager = value;
  }
  
  trackAssetEvent(eventType, gameId, assetType, assetUrl, metadata = {}, ignorePerGameSetting = false) {
    this.batchAnalytics.trackEvent(eventType, gameId, assetType, assetUrl, metadata, ignorePerGameSetting);
  }
  
  getViewportInfo() {
    return this.batchAnalytics.getViewportInfo();
  }
}


