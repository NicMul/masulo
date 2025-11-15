import { h, render } from 'preact';
import { GameVideo } from '../components/GameVideo.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';
import { setupImageFade } from './fadeTransition.js';
import { gameVideoStore } from '../store/gameVideoStore.js';

export function loadVideoWithSpinner(imgElement, gameId, className, style, onComplete) {
  if (!imgElement) return () => {};

  const imgParent = imgElement.parentElement;
  if (!imgParent) return () => {};

  if (window.getComputedStyle(imgParent).position === 'static') {
    imgParent.style.position = 'relative';
  }

  setupImageFade(imgElement);

  let spinnerContainer = null;
  let videoElement = null;
  let spinnerTimeout = null;
  let spinnerStopTimeout = null;
  let cleanupTimeout = null;

  spinnerTimeout = setTimeout(() => {
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

    const videoContainer = document.createElement('div');
    videoContainer.style.position = 'absolute';
    videoContainer.style.top = '0';
    videoContainer.style.left = '0';
    videoContainer.style.width = '100%';
    videoContainer.style.height = '100%';
    videoContainer.style.zIndex = '2';
    videoContainer.style.opacity = '0';
    videoContainer.classList.add('mesulo-video-fade');
    
    imgParent.appendChild(videoContainer);

    render(
      h(GameVideo, {
        gameId,
        className,
        style: styleObj,
        onVideoReady: (videoRef) => {
          if (videoRef) {
            videoElement = videoRef;
            gameVideoStore.updateVideoState(gameId, {
              videoRef: videoRef,
              src: videoRef.src || null
            });
          }
        }
      }),
      videoContainer
    );

    spinnerStopTimeout = setTimeout(() => {
      const spinner = spinnerContainer?.querySelector('.mesulo-spinner');
      if (spinner) {
        spinner.classList.add('stopped');
        spinner.style.animation = 'none';
        spinner.style.animationPlayState = 'paused';
      }
      
      imgElement.style.opacity = '0';
      
      setTimeout(() => {
        if (videoElement && imgElement.parentElement) {
          const computedStyle = window.getComputedStyle(imgElement);
          const imgDisplay = computedStyle.display;
          const imgPosition = computedStyle.position;
          const imgWidth = computedStyle.width;
          const imgHeight = computedStyle.height;
          
          const videoClone = videoElement.cloneNode(true);
          videoClone.style.opacity = '1';
          videoClone.style.visibility = 'visible';
          videoClone.style.display = imgDisplay !== 'none' ? imgDisplay : 'block';
          videoClone.style.position = imgPosition !== 'static' ? imgPosition : 'relative';
          videoClone.style.width = '100%';
          videoClone.style.height = '100%';
          videoClone.style.maxWidth = '100%';
          videoClone.style.maxHeight = '100%';
          videoClone.style.objectFit = 'cover';
          videoClone.style.objectPosition = 'center center';
          
          if (spinnerContainer && spinnerContainer.parentElement) {
            spinnerContainer.parentElement.removeChild(spinnerContainer);
          }
          
          imgElement.replaceWith(videoClone);
          
          if (videoContainer && videoContainer.parentElement) {
            videoContainer.parentElement.removeChild(videoContainer);
          }
          
          gameVideoStore.updateVideoState(gameId, {
            videoRef: videoClone
          });
          
          if (onComplete) {
            onComplete(videoClone);
          }
        }
      }, 600);
    }, 3000);
  }, 2000);

  return () => {
    if (spinnerTimeout) clearTimeout(spinnerTimeout);
    if (spinnerStopTimeout) clearTimeout(spinnerStopTimeout);
    if (cleanupTimeout) clearTimeout(cleanupTimeout);
    
    if (spinnerContainer && spinnerContainer.parentElement) {
      spinnerContainer.parentElement.removeChild(spinnerContainer);
    }
  };
}

