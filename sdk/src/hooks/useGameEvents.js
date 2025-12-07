import { useEffect } from 'preact/hooks';
import {
  detectInteractiveElement,
  handleHover,
  handleClick,
  handleButtonClick
} from '../utils/eventHandlers.js';
import { pauseAllVideos } from '../utils/videoManager.js';
import { gameVideoStore } from '../store/gameVideoStore.js';

export function useGameEvents(containerElement, gameId, handlers = {}) {
  // Helper to get video ref from store
  const getVideoRef = () => {
    const state = gameVideoStore.getVideoState(gameId);
    return state?.videoRef || null;
  };


  useEffect(() => {
    if (!containerElement) return;

    let hasTrackedImpression = false;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio > 0.75) {
            // Track impression when game card enters viewport
            if (!hasTrackedImpression) {
              const analytics = window.mesuloPreactSDK?.analytics;
              const videoRef = getVideoRef();
              const videoUrl = videoRef?.src;

              if (analytics && videoUrl) {
                analytics.trackEvent('impression', gameId, 'video', videoUrl, {
                  visibility_ratio: entry.intersectionRatio
                });
                hasTrackedImpression = true;
              }
            }
          } else {
            // Reset when leaving viewport
            hasTrackedImpression = false;
          }
        });
      },
      {
        threshold: 0.75
      }
    );

    intersectionObserver.observe(containerElement);

    return () => {
      intersectionObserver.disconnect();
    };
  }, [containerElement, gameId]);

  useEffect(() => {
    if (!containerElement) {
      return;
    }

    let touchStartTarget = null;
    let isTouchInteraction = false;

    const handleMouseEnter = (e) => {
      if (isTouchInteraction) return;
      handleHover(gameId, containerElement, true, e, getVideoRef(), handlers.onHover);
    };

    const handleMouseLeave = (e) => {
      if (isTouchInteraction) return;
      handleHover(gameId, containerElement, false, e, getVideoRef(), handlers.onHover);
    };

    const handleClickEvent = (e) => {
      if (isTouchInteraction) {
        isTouchInteraction = false;
        return;
      }

      const interactiveElement = detectInteractiveElement(e.target);

      if (interactiveElement) {
        handleButtonClick(
          gameId,
          containerElement,
          interactiveElement,
          e,
          getVideoRef(),
          handlers.onButtonClick
        );
      } else {
        // Track video click analytics
        const analytics = window.mesuloPreactSDK?.analytics;
        const videoRef = getVideoRef();
        const videoUrl = videoRef?.src;

        if (analytics && videoUrl) {
          analytics.trackEvent('video_click', gameId, 'video', videoUrl, {});
        }

        handleClick(gameId, containerElement, e, getVideoRef(), handlers.onClick);
      }
    };

    const handleTouchStart = (e) => {
      isTouchInteraction = true;
      touchStartTarget = e.target;

      handleHover(gameId, containerElement, true, e, getVideoRef(), handlers.onHover);
    };

    const handleTouchEnd = (e) => {
      if (!touchStartTarget) return;

      const touchEndTarget = e.target;
      const interactiveElement = detectInteractiveElement(touchEndTarget);

      if (interactiveElement) {
        handleButtonClick(
          gameId,
          containerElement,
          interactiveElement,
          e,
          getVideoRef(),
          handlers.onButtonClick
        );
      } else {
        // On touch end, only call custom handler, don't toggle video
        // Video should continue playing after touch ends
        if (handlers.onClick) {
          handlers.onClick(gameId, containerElement, e);
        }
      }

      touchStartTarget = null;
    };

    const handleTouchCancel = () => {
      handleHover(gameId, containerElement, false, null, getVideoRef(), handlers.onHover);
      touchStartTarget = null;
      isTouchInteraction = false;
    };

    containerElement.addEventListener('mouseenter', handleMouseEnter);
    containerElement.addEventListener('mouseleave', handleMouseLeave);
    containerElement.addEventListener('click', handleClickEvent);
    containerElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    containerElement.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      containerElement.removeEventListener('mouseenter', handleMouseEnter);
      containerElement.removeEventListener('mouseleave', handleMouseLeave);
      containerElement.removeEventListener('click', handleClickEvent);
      containerElement.removeEventListener('touchstart', handleTouchStart);
      containerElement.removeEventListener('touchend', handleTouchEnd);
      containerElement.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [containerElement, gameId, handlers.onHover, handlers.onClick, handlers.onButtonClick]);


  useEffect(() => {
    const handleDocumentClick = (e) => {
      const clickedElement = e.target;
      const gameContainer = clickedElement.closest('[data-mesulo-game-id]');

      if (!gameContainer) {
        pauseAllVideos();
      }
    };


    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('touchend', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('touchend', handleDocumentClick, true);
    };
  }, []);
}

