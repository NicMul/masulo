import { BatchAnalytics } from '../analytics/batchAnalytics.js';

let analyticsInstance = null;

export function useAnalyticsLifecycle(connectionManager) {
    if (!analyticsInstance && connectionManager) {
        analyticsInstance = new BatchAnalytics(connectionManager);
        analyticsInstance.setupGlobalClickTracking();

        // Handle connection events
        connectionManager.on('connected', () => {
            analyticsInstance.onConnectionEstablished();
        });

        // Listen for game updates to update the games map for validation
        connectionManager.on('games-response', (data) => {
            if (data && data.games) {
                analyticsInstance.updateGamesMap(data.games);
            }
        });

        connectionManager.on('game-updated', (data) => {
            if (data && data.games) {
                analyticsInstance.updateGamesMap(data.games);
            }
        });
    }

    return {
        getAnalytics: () => analyticsInstance,
        trackEvent: (eventType, gameId, assetType, assetUrl, metadata, ignorePerGameSetting) => {
            if (analyticsInstance) {
                analyticsInstance.trackEvent(eventType, gameId, assetType, assetUrl, metadata, ignorePerGameSetting);
            }
        }
    };
}
