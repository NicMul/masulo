import { h, render } from 'preact';
import { GameCardWrapper } from './components/GameCardWrapper.jsx';
import { injectSpinnerStyles } from './utils/spinnerStyles.js';
import { getApplicationKeyFromScript } from './realtime/scriptLoader.js';
import { getConnectionManager } from './realtime/connectionManager.js';
import { processAllGames, processGameElement } from './utils/batchGameProcessor.js';
import { requestGames } from './data/gameRequest.js';

const TARGET_GAME_ID = 'd5352f25-9718-44a6-a95d-1ddd47ea63ce';
const handlers = new Map(); 
const mountPoints = new WeakMap(); 

function upgradeElement(containerElement) {
  if (!containerElement.hasAttribute('data-mesulo-game-id')) return;
  
  const gameId = containerElement.getAttribute('data-mesulo-game-id');
  
  if (gameId !== TARGET_GAME_ID) return;
  

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

  const selector = `[data-mesulo-game-id="${TARGET_GAME_ID}"]`;
  const elements = document.querySelectorAll(selector);
  
  elements.forEach(element => {
    upgradeElement(element);
  });
}

function init() {

  if (window.mesuloPreactSDK) {
    console.warn('[Mesulo Preact SDK] Already initialized');
    return;
  }

  // Inject spinner and fade transition styles
  injectSpinnerStyles();

  // Extract application key from script tag
  const applicationKey = getApplicationKeyFromScript();
  
  // Initialize socket connection if application key exists
  let connectionManager = null;
  if (applicationKey) {
    connectionManager = getConnectionManager(applicationKey);
    connectionManager.connect();
    
    connectionManager.on('connected', () => {
      requestGames(connectionManager);
    });
    
    connectionManager.on('games-response', (data) => {
      console.log('[Mesulo Preact SDK] Games response received:', data);
    });
  }

  upgradeAllElements();
  
  processAllGames();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { 
          if (node.hasAttribute('data-mesulo-game-id')) {
            const gameId = node.getAttribute('data-mesulo-game-id');
            if (gameId === TARGET_GAME_ID) {
              upgradeElement(node);
            }
            processGameElement(node);
          }
          const containers = node.querySelectorAll?.('[data-mesulo-game-id]');
          containers?.forEach(container => {
            const gameId = container.getAttribute('data-mesulo-game-id');
            if (gameId === TARGET_GAME_ID) {
              upgradeElement(container);
            }
            processGameElement(container);
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

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
    // Socket connection API
    connect: (appKey) => {
      const key = appKey || applicationKey;
      if (!key) {
        console.warn('[Mesulo Preact SDK] No application key provided');
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
      } else {
        console.warn('[Mesulo Preact SDK] Connection manager not initialized. Call connect() first.');
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

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
