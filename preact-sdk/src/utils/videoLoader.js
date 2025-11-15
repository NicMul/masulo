import { h, render } from 'preact';
import { GameVideo } from '../components/GameVideo.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';
import { setupImageFade } from './fadeTransition.js';
import { gameVideoStore } from '../store/gameVideoStore.js';

export function loadVideoWithSpinner(imgElement, gameId, className, style, poster, version, existingSpinnerContainer = null, onComplete) {
  if (!imgElement) return () => {};

  const imgParent = imgElement.parentElement;
  if (!imgParent) return () => {};

  if (window.getComputedStyle(imgParent).position === 'static') {
    imgParent.style.position = 'relative';
  }

  setupImageFade(imgElement);

  let spinnerContainer = existingSpinnerContainer;
  let videoElement = null;
  let spinnerTimeout = null;
  let spinnerStopTimeout = null;
  let cleanupTimeout = null;

  spinnerTimeout = setTimeout(() => {
    if (!spinnerContainer) {
      spinnerContainer = document.createElement('div');
      spinnerContainer.style.position = 'absolute';
      spinnerContainer.style.bottom = '5px';
      spinnerContainer.style.right = '5px';
      spinnerContainer.style.zIndex = '1000';
      spinnerContainer.style.pointerEvents = 'none';
      
      imgParent.appendChild(spinnerContainer);
      render(h(LoadingSpinner), spinnerContainer);
      
      setTimeout(() => {
        const spinner = spinnerContainer.querySelector('.mesulo-spinner');
        if (spinner) {
          spinner.classList.add('visible');
        }
      }, 10);
    }

    const styleObj = {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
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
    }

    imgElement.style.opacity = '0';
    
    setTimeout(() => {
      const mountPoint = document.createElement('div');
      
      imgElement.replaceWith(mountPoint);

      render(
        h(GameVideo, {
          gameId,
          className,
          style: styleObj,
          poster,
          version,
          wrapperClassName: 'mesulo-video-fade', 
          onVideoReady: (videoRef) => {
            if (videoRef) {
              videoElement = videoRef;
            }
          }
        }),
        mountPoint
      );

      requestAnimationFrame(() => {
        const gameVideoWrapper = mountPoint.querySelector('.mesulo-video-fade');
        if (gameVideoWrapper && mountPoint.parentElement) {
          mountPoint.replaceWith(gameVideoWrapper);
        }
      });

      spinnerStopTimeout = setTimeout(() => {
        const spinner = spinnerContainer?.querySelector('.mesulo-spinner');
        if (spinner) {
          spinner.classList.add('stopped');
          spinner.style.animation = 'none';
          spinner.style.animationPlayState = 'paused';
        }
        
        setTimeout(() => {
          if (videoElement) {
            const gameVideoWrapper = imgParent.querySelector('.mesulo-video-fade');
            if (gameVideoWrapper) {
              if (spinnerContainer) {
                spinnerContainer.style.opacity = '0';
                spinnerContainer.style.visibility = 'hidden';
              }
              
              gameVideoWrapper.style.opacity = '1';
              gameVideoWrapper.style.visibility = 'visible';
              
              if (onComplete) {
                onComplete(videoElement);
              }
            }
          }
        }, 600);
      }, 3000);
    }, 600); 
  }, 2000);

  return () => {
    if (spinnerTimeout) clearTimeout(spinnerTimeout);
    if (spinnerStopTimeout) clearTimeout(spinnerStopTimeout);
    if (cleanupTimeout) clearTimeout(cleanupTimeout);
    
    if (spinnerContainer && !existingSpinnerContainer && spinnerContainer.parentElement) {
      spinnerContainer.parentElement.removeChild(spinnerContainer);
    }
  };
}

