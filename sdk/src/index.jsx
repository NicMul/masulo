import { h, render } from 'preact';
import { createPortal } from 'preact/compat';
import { GameCardWrapper } from './components/GameCardWrapper.jsx';
import { injectLoadingSpinnerStyles } from './utils/loadingSpinnerStyles.js';
import { DebugWindow } from './components/debug/DebugWindow';
import { getApplicationKeyFromScript } from './realtime/scriptLoader.js';
import { getConnectionManager } from './realtime/connectionManager.js';
import { useInitialLoadLifecycle } from './hooks/useInitialLoadLifecycle.js';
import { useGameUpdateLifecycle } from './hooks/useGameUpdateLifecycle.js';
import { usePromotionsLifecycle } from './hooks/usePromotionsLifecycle.js';
import { useABTestLifecycle } from './hooks/useABTestLifecycle.js';
import { useAnalyticsLifecycle } from './hooks/useAnalyticsLifecycle.js';
import { requestPromotions } from './data/promotionsRequest.js';
import { requestABTests } from './data/abtestRequest.js';
import { requestGames } from './data/gameRequest.js';
import { promotionsStore } from './store/promotionsStore.js';
import { activeGamesStore, registerMesuloGameElement } from './elements/MesuloGameElement.js';

const handlers = new Map();

function SdkRoot() {
  const activeGames = activeGamesStore.value;
  const portals = [];

  activeGames.forEach((containerElement, gameId) => {
    const gameHandlers = handlers.get(gameId) || handlers.get('*') || {};

    portals.push(
      createPortal(
        h(GameCardWrapper, {
          gameId,
          containerElement,
          handlers: gameHandlers
        }),
        containerElement
      )
    );
  });

  return h('div', { id: 'mesulo-sdk-root-internal', style: { display: 'none' } }, portals);
}

function renderDebugWindow(connectionManager) {
  const debugContainer = document.createElement('div');
  debugContainer.id = 'mesulo-debug-root';
  document.body.appendChild(debugContainer);

  render(h(DebugWindow, { connectionManager }), debugContainer);
}

function init() {
  try {
    if (window.mesuloPreactSDK) {
      return;
    }

    injectLoadingSpinnerStyles();

    const applicationKey = getApplicationKeyFromScript();

    let connectionManager = null;
    let lifecycleManager = null;
    let analyticsLifecycleManager = null;
    let gamesData = null; // Store games data for promotions lifecycle

    if (applicationKey) {
      connectionManager = getConnectionManager(applicationKey);

      // Render Debug Window
      renderDebugWindow(connectionManager);

      lifecycleManager = useInitialLoadLifecycle(connectionManager);
      const updateLifecycleManager = useGameUpdateLifecycle();
      const promotionsLifecycleManager = usePromotionsLifecycle();
      const abtestLifecycleManager = useABTestLifecycle(connectionManager);
      analyticsLifecycleManager = useAnalyticsLifecycle(connectionManager);

      connectionManager.connect();

      connectionManager.on('connected', () => {
        lifecycleManager.initialize();
        requestPromotions(connectionManager);
        requestABTests(connectionManager);
      });

      connectionManager.on('games-response', (data) => {
        if (data && data.games) {
          gamesData = data.games;
        }
        lifecycleManager.handleGamesResponse(data);
      });

      connectionManager.on('game-updated', (data) => {
        if (data && data.games) {
          data.games.forEach(updatedGame => {
            if (gamesData) {
              const index = gamesData.findIndex(g => g.id === updatedGame.id);
              if (index >= 0) {
                gamesData[index] = updatedGame;
              } else {
                gamesData.push(updatedGame);
              }
            }
          });
        }
        updateLifecycleManager.handleGameUpdate(data);
      });

      connectionManager.on('promotions-response', (data) => {
        if (data && data.promotions) {
          promotionsLifecycleManager.handlePromotionsUpdate(data.promotions, gamesData);
        }
      });

      connectionManager.on('promotions-updated', (data) => {
        if (connectionManager && connectionManager.isConnected) {
          requestGames(connectionManager);
          requestPromotions(connectionManager);
        }
      });

      connectionManager.on('abtests-response', (data) => {
        if (data && data.abtests) {
          abtestLifecycleManager.handleABTestsUpdate(data.abtests, gamesData);
        }
      });

      connectionManager.on('abtests-updated', (data) => {
        if (connectionManager && connectionManager.isConnected) {
          requestGames(connectionManager);
          requestABTests(connectionManager);
        }
      });
    }

    registerMesuloGameElement();

    const rootMountPoint = document.createElement('div');
    rootMountPoint.id = 'mesulo-sdk-app-root';
    document.body.appendChild(rootMountPoint);
    render(h(SdkRoot), rootMountPoint);

    if (lifecycleManager) {
      if (connectionManager && connectionManager.isConnected) {
        lifecycleManager.initialize();
      }
    }

    window.mesuloPreactSDK = {
      on: (gameId, eventHandlers) => {
        handlers.set(gameId, eventHandlers);
        // Force a re-render of the root to update portals with new handlers
        activeGamesStore.value = new Map(activeGamesStore.value);
      },
      off: (gameId) => {
        handlers.delete(gameId);
        // Force a re-render of the root to update portals without handlers
        activeGamesStore.value = new Map(activeGamesStore.value);
      },

      connect: (appKey) => {
        const key = appKey || applicationKey;
        if (!key) {
          return;
        }
        if (!connectionManager) {
          connectionManager = getConnectionManager(key);
        }
        connectionManager.connect();
      },
      disconnect: () => {
        if (connectionManager) {
          connectionManager.disconnect();
        }
      },
      onSocket: (event, callback) => {
        if (connectionManager) {
          connectionManager.on(event, callback);
        }
      },
      offSocket: (event, callback) => {
        if (connectionManager) {
          connectionManager.off(event, callback);
        }
      },
      getConnectionManager: () => connectionManager,
      analytics: analyticsLifecycleManager
    };
  } catch (error) {
    console.error('Mesulo SDK: init failed', error);
  }
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
