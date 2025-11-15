import { requestGames } from '../data/gameRequest.js';
import { useInitialLoad } from './useInitialLoad.js';
import { getGameAssets } from '../utils/getGameAssets.js';
import { createSpinner } from '../utils/videoLoader.js';
import { replaceImageWithVideo } from '../utils/videoLoader.js';

const PHASE_WAITING = 'waiting';
const PHASE_SPINNER = 'spinner';
const PHASE_TRANSITION = 'transition';
const PHASE_COMPLETE = 'complete';

export function useInitialLoadLifecycle(connectionManager) {
  const gameElements = new Map();
  const loadResources = useInitialLoad();
  let gamesResponseData = null;

  function findGameElements() {
    const elements = document.querySelectorAll('[data-mesulo-game-id]');
    const gameIds = new Set();
    
    elements.forEach(element => {
      const gameId = element.getAttribute('data-mesulo-game-id');
      if (!gameId) return;
      
      const imgElement = element.querySelector('img');
      if (!imgElement) return;
      
      if (!gameElements.has(gameId)) {
        gameElements.set(gameId, {
          element,
          imgElement,
          phase: PHASE_WAITING,
          spinnerContainer: null,
          waitTimer: null,
          spinnerTimer: null,
          gameData: null
        });
        gameIds.add(gameId);
      }
    });
    
    return Array.from(gameIds);
  }

  function startWaitingPhase(gameId) {
    const gameState = gameElements.get(gameId);
    if (!gameState || gameState.phase !== PHASE_WAITING) return;

    gameState.waitTimer = setTimeout(() => {
      startSpinnerPhase(gameId);
    }, 2000);
  }

  function startSpinnerPhase(gameId) {
    const gameState = gameElements.get(gameId);
    if (!gameState) return;

    if (gameState.phase === PHASE_WAITING && gameState.waitTimer) {
      clearTimeout(gameState.waitTimer);
    }

    gameState.phase = PHASE_SPINNER;
    gameState.spinnerContainer = createSpinner(gameState.imgElement, gameId);

    gameState.spinnerTimer = setTimeout(() => {
      startTransitionPhase(gameId);
    }, 3000);
  }

  function startTransitionPhase(gameId) {
    const gameState = gameElements.get(gameId);
    if (!gameState) return;

    if (gameState.spinnerTimer) {
      clearTimeout(gameState.spinnerTimer);
    }

    gameState.phase = PHASE_TRANSITION;

    let videoUrl = null;
    let posterUrl = gameState.imgElement.src || gameState.imgElement.getAttribute('src') || '';

    if (gameState.gameData) {
      const assets = getGameAssets(gameState.gameData);
      videoUrl = assets.videoUrl;
      if (assets.imageUrl) {
        posterUrl = assets.imageUrl;
      }
    }

    const className = gameState.imgElement.className || '';
    const style = gameState.imgElement.style.cssText || '';

    replaceImageWithVideo(
      gameState.imgElement,
      gameId,
      videoUrl,
      posterUrl,
      className,
      style,
      () => {
        if (gameState.spinnerContainer) {
          const spinner = gameState.spinnerContainer.querySelector('.mesulo-spinner');
          if (spinner) {
            spinner.classList.add('stopped');
            spinner.style.animation = 'none';
            spinner.style.animationPlayState = 'paused';
          }
          
          setTimeout(() => {
            if (gameState.spinnerContainer) {
              gameState.spinnerContainer.style.opacity = '0';
              gameState.spinnerContainer.style.visibility = 'hidden';
            }
          }, 600);
        }
        
        gameState.phase = PHASE_COMPLETE;
      }
    );
  }

  function initialize() {
    const gameIds = findGameElements();
    
    if (gameIds.length === 0) {
      return;
    }

    if (connectionManager && connectionManager.isConnected) {
      requestGames(connectionManager);
    } else {
      connectionManager?.on('connected', () => {
        requestGames(connectionManager);
      });
    }

    gameIds.forEach(gameId => {
      startWaitingPhase(gameId);
    });
  }

  function handleGamesResponse(data) {
    if (!data || !data.games || !Array.isArray(data.games)) {
      return;
    }

    gamesResponseData = data;
    loadResources(data);

    data.games.forEach(game => {
      if (!game.id) return;
      
      const gameState = gameElements.get(game.id);
      if (!gameState) return;

      gameState.gameData = game;

      if (gameState.phase === PHASE_SPINNER || gameState.phase === PHASE_TRANSITION) {
        if (gameState.phase === PHASE_SPINNER && gameState.spinnerTimer) {
          clearTimeout(gameState.spinnerTimer);
          startTransitionPhase(game.id);
        }
      }
    });
  }

  function cleanup() {
    gameElements.forEach((gameState, gameId) => {
      if (gameState.waitTimer) {
        clearTimeout(gameState.waitTimer);
      }
      if (gameState.spinnerTimer) {
        clearTimeout(gameState.spinnerTimer);
      }
      if (gameState.spinnerContainer && gameState.spinnerContainer.parentElement) {
        gameState.spinnerContainer.parentElement.removeChild(gameState.spinnerContainer);
      }
    });
    gameElements.clear();
  }

  return {
    initialize,
    handleGamesResponse,
    cleanup
  };
}

