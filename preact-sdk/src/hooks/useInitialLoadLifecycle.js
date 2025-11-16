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

  function createWrapperWithSpinner(imgElement, gameId, posterUrl, className, style, version) {
    const imgParent = imgElement.parentElement;
    if (!imgParent) return;

    if (window.getComputedStyle(imgParent).position === 'static') {
      imgParent.style.position = 'relative';
    }

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

    // Use the ORIGINAL image src for base-image (visual continuity)
    const originalImageSrc = imgElement.src || imgElement.getAttribute('src') || posterUrl;

    // Set baseImageSrc in store IMMEDIATELY before rendering
    // This prevents race condition with socket response
    const existingState = gameVideoStore.getVideoState(gameId);
    gameVideoStore.setVideoState(gameId, {
      ...(existingState || {}),
      id: gameId,
      baseImageSrc: originalImageSrc,  // Lock in BEFORE render
      loading: false,
      isInitialLoad: true,  // Mark as initial load
      version,
    });

    // Make original image position absolute so wrapper can render behind it
    imgElement.style.position = 'absolute';
    imgElement.style.top = '0';
    imgElement.style.left = '0';
    imgElement.style.width = '100%';
    imgElement.style.height = '100%';
    imgElement.style.objectFit = 'cover';
    imgElement.style.zIndex = '10';  // Keep it on top initially

    // Render wrapper BEHIND original image
    render(
      h(GameVideo, {
        gameId,
        className,
        style: styleObj,
        poster: originalImageSrc,  // Use original image for initial display
        version,
        wrapperClassName: '',
        onVideoReady: null
      }),
      imgParent
    );

    // Immediately swap from original image to wrapper component
    setTimeout(() => {
      imgElement.style.opacity = '0';
      imgElement.style.transition = 'opacity 0.1s';
      
      setTimeout(() => {
        imgElement.style.display = 'none';
        // Now trigger spinner phase
        gameVideoStore.updateVideoState(gameId, { 
          loading: true
        });
      }, 100);
    }, 10);
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

  function startSpinnerPhase(gameId) {
    const gameState = gameElements.get(gameId);
    if (!gameState) return;

    if (gameState.phase === PHASE_WAITING && gameState.waitTimer) {
      clearTimeout(gameState.waitTimer);
    }

    gameState.phase = PHASE_SPINNER;
    
    // Create the wrapper NOW with loading=true so spinner can show
    const posterUrl = gameState.imgElement.src || gameState.imgElement.getAttribute('src') || '';
    const className = gameState.imgElement.className || '';
    const style = gameState.imgElement.style.cssText || '';
    const version = gameState.imgElement.closest('[data-mesulo-game-id]')?.getAttribute('data-mesulo-version') || '0';
    
    // Create wrapper with spinner visible
    createWrapperWithSpinner(
      gameState.imgElement,
      gameId,
      posterUrl,
      className,
      style,
      version
    );

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

    // Update store with CDN poster and video src
    gameVideoStore.updateVideoState(gameId, {
      poster: posterUrl,
      src: videoUrl
    });

    // Update the existing wrapper with video src
    const videoState = gameVideoStore.getVideoState(gameId);
    if (videoState && videoState.videoRef) {
      const videoEl = videoState.videoRef;
      
      // Set initial invisible state
      videoEl.style.opacity = '0';
      videoEl.style.filter = 'blur(10px)';
      videoEl.style.visibility = 'visible';
      videoEl.style.transition = 'none';
      
      // Update src directly (poster is handled reactively via store)
      // Only populate src if animate is true
      if (videoUrl && videoState.animate !== false) {
        videoEl.src = videoUrl;
      }
      
      // Wait for video to load
      const handleCanPlay = () => {
        // First RAF: Force reflow
        requestAnimationFrame(() => {
          // Second RAF: Add transition and fade in
          requestAnimationFrame(() => {
            videoEl.style.transition = 'opacity 2s ease-in-out, filter 2s ease-in-out';
            videoEl.style.opacity = '1';
            videoEl.style.filter = 'blur(0)';
            
            // Hide spinner and remove image after transition
            setTimeout(() => {
              gameVideoStore.updateVideoState(gameId, { 
                loading: false,
                isInitialLoad: false  // Initial load complete
              });
              if (gameState.imgElement && gameState.imgElement.parentElement) {
                gameState.imgElement.remove();
              }
              gameState.phase = PHASE_COMPLETE;
            }, 2000);
          });
        });
        
        videoEl.removeEventListener('loadedmetadata', handleCanPlay);
      };
      
      videoEl.addEventListener('loadedmetadata', handleCanPlay);
      
      // Fallback in case loadedmetadata doesn't fire
      setTimeout(() => {
        if (gameState.phase === PHASE_TRANSITION) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              videoEl.style.transition = 'opacity 2s ease-in-out, filter 2s ease-in-out';
              videoEl.style.opacity = '1';
              videoEl.style.filter = 'blur(0)';
              
              setTimeout(() => {
                gameVideoStore.updateVideoState(gameId, { 
                  loading: false,
                  isInitialLoad: false  // Initial load complete (fallback)
                });
                if (gameState.imgElement && gameState.imgElement.parentElement) {
                  gameState.imgElement.remove();
                }
                gameState.phase = PHASE_COMPLETE;
              }, 2000);
            });
          });
        }
      }, 500);
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

      if (gameState.phase === PHASE_SPINNER || gameState.phase === PHASE_TRANSITION) {
        if (gameState.phase === PHASE_SPINNER && gameState.spinnerTimer) {
          clearTimeout(gameState.spinnerTimer);
          startTransitionPhase(game.id);
        }
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

