import { h, render } from 'preact';
import { GameCardWrapper } from './components/GameCardWrapper.jsx';
import { injectLoadingSpinnerStyles } from './utils/loadingSpinnerStyles.js';
import { getApplicationKeyFromScript } from './realtime/scriptLoader.js';
import { getConnectionManager } from './realtime/connectionManager.js';
import { useInitialLoadLifecycle } from './hooks/useInitialLoadLifecycle.js';
import { useGameUpdateLifecycle } from './hooks/useGameUpdateLifecycle.js';
import { usePromotionsLifecycle } from './hooks/usePromotionsLifecycle.js';
import { requestPromotions } from './data/promotionsRequest.js';
import { requestGames } from './data/gameRequest.js';
import { promotionsStore } from './store/promotionsStore.js';

const handlers = new Map(); 
const mountPoints = new WeakMap(); 

function upgradeElement(containerElement) {
  if (!containerElement.hasAttribute('data-mesulo-game-id')) return;
  
  const gameId = containerElement.getAttribute('data-mesulo-game-id');
  
  if (containerElement.hasAttribute('data-mesulo-wrapped')) {
    return;
  }


  containerElement.setAttribute('data-mesulo-wrapped', 'true');
  

  const mountPoint = document.createElement('div');
  mountPoint.style.display = 'none';
  mountPoint.style.position = 'absolute';
  mountPoint.style.pointerEvents = 'none';
  mountPoint.setAttribute('data-mesulo-mount', gameId);
  document.body.appendChild(mountPoint);
  

  mountPoints.set(containerElement, mountPoint);
 
  const gameHandlers = handlers.get(gameId) || handlers.get('*') || {};
  

  render(
    h(GameCardWrapper, {
      gameId,
      containerElement,
      handlers: gameHandlers
    }),
    mountPoint
  );
}

function upgradeAllElements() {
  const selector = '[data-mesulo-game-id]';
  const elements = document.querySelectorAll(selector);
  
  elements.forEach(element => {
    upgradeElement(element);
  });
}

function init() {

  if (window.mesuloPreactSDK) {
    return;
  }

  injectLoadingSpinnerStyles();

  const applicationKey = getApplicationKeyFromScript();
  
  let connectionManager = null;
  let lifecycleManager = null;
  let gamesData = null; // Store games data for promotions lifecycle
  
  if (applicationKey) {
    connectionManager = getConnectionManager(applicationKey);
    lifecycleManager = useInitialLoadLifecycle(connectionManager);
    const updateLifecycleManager = useGameUpdateLifecycle();
    const promotionsLifecycleManager = usePromotionsLifecycle();
    connectionManager.connect();
    
    connectionManager.on('connected', () => {
      lifecycleManager.initialize();
      requestPromotions(connectionManager);
    });
    
    connectionManager.on('games-response', (data) => {
      if (data && data.games) {
        gamesData = data.games;
        promotionsStore.updateGameMapping(data.games);
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
        promotionsStore.updateGameMapping(gamesData);
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
  }

  upgradeAllElements();
  
  if (lifecycleManager) {
    if (connectionManager && connectionManager.isConnected) {
      lifecycleManager.initialize();
    }
  }

  window.mesuloPreactSDK = {
    upgrade: upgradeAllElements,
    upgradeElement,
    on: (gameId, eventHandlers) => {
      handlers.set(gameId, eventHandlers);
      
      document.querySelectorAll(`[data-mesulo-game-id="${gameId}"]`).forEach(el => {
        if (el.hasAttribute('data-mesulo-wrapped')) {
          const mountPoint = mountPoints.get(el);
          if (mountPoint) {
            render(
              h(GameCardWrapper, {
                gameId,
                containerElement: el,
                handlers: eventHandlers
              }),
              mountPoint
            );
          }
        }
      });
    },
    off: (gameId) => {
      handlers.delete(gameId);
      
     
      document.querySelectorAll(`[data-mesulo-game-id="${gameId}"]`).forEach(el => {
        if (el.hasAttribute('data-mesulo-wrapped')) {
          const mountPoint = mountPoints.get(el);
          if (mountPoint) {
            const universalHandlers = handlers.get('*') || {};
            render(
              h(GameCardWrapper, {
                gameId,
                containerElement: el,
                handlers: universalHandlers
              }),
              mountPoint
            );
          }
        }
      });
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
    getConnectionManager: () => connectionManager
  };
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
