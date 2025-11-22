import { h, render } from 'preact';
import { requestGames } from '../data/gameRequest.js';
import { useInitialLoad } from './useInitialLoad.js';
import { getGameAssets } from '../utils/getGameAssets.js';
import { GameVideo } from '../components/GameVideo.jsx';
import { gameVideoStore } from '../store/gameVideoStore.js';
import { promotionsStore } from '../store/promotionsStore.js';

const PHASE_WAITING = 'waiting';
const PHASE_SPINNER = 'spinner';
const PHASE_TRANSITION = 'transition';
const PHASE_COMPLETE = 'complete';

export function useInitialLoadLifecycle(connectionManager) {
  const gameElements = new Map();
  const loadResources = useInitialLoad();
  let gamesResponseData = null;
  let initialLoadComplete = false;

  async function createAndAnimateWrapper(imgElement, gameId, gameData) {
    const imgParent = imgElement.parentElement;
    if (!imgParent) return;

    if (window.getComputedStyle(imgParent).position === 'static') {
      imgParent.style.position = 'relative';
    }

    const className = imgElement.className || '';
    const style = imgElement.style.cssText || '';
    const version = imgElement.closest('[data-mesulo-game-id]')?.getAttribute('data-mesulo-version') || '0';

    const styleObj = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    };

    if (style && typeof style === 'string') {
      const stylePairs = style.split(';').filter(s => s.trim());
      stylePairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          styleObj[camelKey] = value;
        }
      });
    } else if (typeof style === 'object') {
      Object.assign(styleObj, style);
    }

    // Get assets from game data
    const assets = getGameAssets(gameData);
    const posterUrl = assets.imageUrl;
    const videoUrl = assets.videoUrl;
    const defaultImageUrl = assets.defaultImage;

    // Set initial state in store
    const existingState = gameVideoStore.getVideoState(gameId);
    gameVideoStore.setVideoState(gameId, {
      ...(existingState || {}),
      id: gameId,
      poster: posterUrl,
      src: videoUrl,
      defaultImage: defaultImageUrl,
      version,
      loading: false,
      published: gameData.published || false,
      animate: gameData.animate !== undefined ? gameData.animate : true,
      hover: gameData.hover !== undefined ? gameData.hover : true,
      type: gameData.publishedType || 'default',
      scroll: gameData.scroll,
      isInitialLoad: true,
    });

    // Render wrapper with new structure
    render(
      h(GameVideo, {
        gameId,
        className,
        style: styleObj,
        poster: posterUrl,
        defaultImage: defaultImageUrl,
        version,
        wrapperClassName: '',
        onVideoReady: null
      }),
      imgParent
    );

    // Wait for next frame to ensure DOM is ready
    await new Promise(resolve => requestAnimationFrame(resolve));

    const videoState = gameVideoStore.getVideoState(gameId);
    if (!videoState || !videoState.videoRef || !videoState.containerRef || !videoState.spinnerRef) {
      return;
    }

    const videoEl = videoState.videoRef;
    const containerEl = videoState.containerRef;
    const spinnerEl = videoState.spinnerRef;

    // Phase 1: Set initial states (immediate)
    videoEl.style.opacity = '0';
    videoEl.style.filter = 'blur(10px)';
    containerEl.style.opacity = '0';
    spinnerEl.style.opacity = '0';

    // Set video source if animate is enabled
    if (videoUrl && gameData.animate !== false) {
      videoEl.src = videoUrl;
    }

    // Phase 2: Fade in container (wait 1s, transition 1s)
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Remove inline style so CSS class can take effect
    containerEl.style.opacity = '';
    await new Promise(resolve => requestAnimationFrame(resolve));
    containerEl.classList.add('mesulo-container-fade-in');

    // Phase 3: Fade in spinner (wait 1s, transition 1s)
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Remove inline style so CSS class can take effect
    spinnerEl.style.opacity = '';
    await new Promise(resolve => requestAnimationFrame(resolve));
    spinnerEl.classList.add('mesulo-spinner-active', 'mesulo-spinner-fade-in');

    // Phase 4: Fade in video (wait 2s, transition 2s)
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Remove inline styles so CSS class can take effect
    videoEl.style.opacity = '';
    videoEl.style.filter = '';
    // Wait for next frame to ensure styles are cleared before transition
    await new Promise(resolve => requestAnimationFrame(resolve));
    videoEl.classList.add('mesulo-video-fade-in');

    // Wait for video transition to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Phase 5: Remove original image, hide container and spinner (immediate)
    if (imgElement && imgElement.parentElement) {
      imgElement.remove();
    }

    // Hide container and spinner
    containerEl.classList.remove('mesulo-container-fade-in');
    containerEl.classList.add('mesulo-container-hidden');
    spinnerEl.classList.remove('mesulo-spinner-fade-in', 'mesulo-spinner-active');
    spinnerEl.classList.add('mesulo-spinner-hidden');

    // Mark initial load as complete
    gameVideoStore.updateVideoState(gameId, {
      isInitialLoad: false
    });
  }

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

  async function startSpinnerPhase(gameId) {
    const gameState = gameElements.get(gameId);
    if (!gameState) return;

    if (gameState.phase === PHASE_WAITING && gameState.waitTimer) {
      clearTimeout(gameState.waitTimer);
    }

    gameState.phase = PHASE_SPINNER;

    // If we have game data, start the animation immediately
    if (gameState.gameData) {
      await createAndAnimateWrapper(
        gameState.imgElement,
        gameId,
        gameState.gameData
      );
      gameState.phase = PHASE_COMPLETE;
    } else {
      // Wait for game data with a timeout
      gameState.spinnerTimer = setTimeout(() => {
        // If we still don't have game data after timeout, try to proceed anyway
        if (gameState.gameData) {
          createAndAnimateWrapper(
            gameState.imgElement,
            gameId,
            gameState.gameData
          ).then(() => {
            gameState.phase = PHASE_COMPLETE;
          });
        }
      }, 3000);
    }
  }

  function startTransitionPhase(gameId) {
    // This function is now handled by createAndAnimateWrapper
    // Keeping stub for compatibility
    const gameState = gameElements.get(gameId);
    if (!gameState) return;

    if (gameState.spinnerTimer) {
      clearTimeout(gameState.spinnerTimer);
    }

    if (gameState.gameData) {
      createAndAnimateWrapper(
        gameState.imgElement,
        gameId,
        gameState.gameData
      ).then(() => {
        gameState.phase = PHASE_COMPLETE;
      });
    }
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

    if (initialLoadComplete) {
      return;
    }

    gamesResponseData = data;
    loadResources(data);

    data.games.forEach(game => {
      if (!game.id) return;

      const gameState = gameElements.get(game.id);
      if (!gameState) return;

      gameState.gameData = game;

      // If we're in waiting phase or spinner phase and now have data, start animation
      if (gameState.phase === PHASE_WAITING || gameState.phase === PHASE_SPINNER) {
        if (gameState.waitTimer) {
          clearTimeout(gameState.waitTimer);
        }
        if (gameState.spinnerTimer) {
          clearTimeout(gameState.spinnerTimer);
        }

        createAndAnimateWrapper(
          gameState.imgElement,
          game.id,
          game
        ).then(() => {
          gameState.phase = PHASE_COMPLETE;
        });
      }
    });

    initialLoadComplete = true;
  }

  function cleanup() {
    gameElements.forEach((gameState, gameId) => {
      if (gameState.waitTimer) {
        clearTimeout(gameState.waitTimer);
      }
      if (gameState.spinnerTimer) {
        clearTimeout(gameState.spinnerTimer);
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

