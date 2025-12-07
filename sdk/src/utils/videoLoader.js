import { h, render } from 'preact';
import { GameVideo } from '../components/GameVideo.jsx';
import { gameVideoStore } from '../store/gameVideoStore.js';

export function replaceImageWithVideo(imgElement, gameId, videoUrl, posterUrl, className, style, onComplete) {
  if (!imgElement) return;

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

  const version = imgElement.closest('[data-mesulo-game-id]')?.getAttribute('data-mesulo-version') || '0';

  setTimeout(() => {
    render(
      h(GameVideo, {
        gameId,
        className,
        style: styleObj,
        poster: posterUrl || imgElement.src,
        version,
        wrapperClassName: 'mesulo-video-fade',
        onVideoReady: (videoRef) => {
          if (!videoRef) return;
          
          const videoEl = videoRef;
          videoEl.style.opacity = '0';
          videoEl.style.filter = 'blur(10px)';
          videoEl.style.visibility = 'visible';
          
          requestAnimationFrame(() => {
            videoEl.classList.add('mesulo-video-visible');
            
            if (onComplete) {
              setTimeout(() => {
                if (imgElement && imgElement.parentElement) {
                  imgElement.remove();
                }
                onComplete(videoRef);
              }, 2000);
            }
          });
        }
      }),
      imgParent
    );
  }, 1000);
}

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
      // Create mount point with display: contents so spinner renders directly
      spinnerContainer = document.createElement('div');
      spinnerContainer.style.display = 'contents';
      spinnerContainer.setAttribute('data-mesulo-loading-spinner', 'true');
      
      imgParent.appendChild(spinnerContainer);
      render(h(LoadingSpinner), spinnerContainer);
      
      setTimeout(() => {
        const spinner = imgParent.querySelector('.mesulo-spinner');
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

    // Keep image visible - don't fade it out
    // imgElement.style.opacity = '0';
    
    setTimeout(() => {
      const mountPoint = document.createElement('div');
      
      // Append video instead of replacing image - keep image in DOM
      imgParent.appendChild(mountPoint);

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
        const videoEl = mountPoint.querySelector('video.mesulo-video-fade');
        const spinnerEl = mountPoint.querySelector('.mesulo-video-update-spinner');
        
        if (videoEl && mountPoint.parentElement) {
          // Remove spinner if it exists - we don't need it
          if (spinnerEl && spinnerEl.parentElement) {
            spinnerEl.parentElement.removeChild(spinnerEl);
          }
          // Move only video directly to parent, replacing mountPoint
          imgParent.appendChild(videoEl);
          mountPoint.remove();
        }
      });

      spinnerStopTimeout = setTimeout(() => {
        const spinner = imgParent.querySelector('.mesulo-spinner');
        if (spinner) {
          spinner.classList.add('stopped');
          spinner.classList.remove('visible');
          spinner.style.animation = 'none';
          spinner.style.animationPlayState = 'paused';
        }
        
        // Remove spinner mount point if we created it
        if (spinnerContainer && !existingSpinnerContainer && spinnerContainer.parentElement) {
          try {
            spinnerContainer.parentElement.removeChild(spinnerContainer);
          } catch (e) {
            // Element may have already been removed, ignore error
          }
        }
        
        setTimeout(() => {
          if (videoElement) {
            const videoEl = imgParent.querySelector('video.mesulo-video-fade');
            if (videoEl) {
              // Start with opacity 0 and blur, then animate to 1 and no blur
              videoEl.style.opacity = '0';
              videoEl.style.filter = 'blur(10px)';
              videoEl.style.visibility = 'visible';
              
              // Animate to opacity 1 and blur 0
              requestAnimationFrame(() => {
                videoEl.style.transition = 'opacity 2s ease-in-out, filter 2s ease-in-out';
                videoEl.style.opacity = '1';
                videoEl.style.filter = 'blur(0)';
                
                if (onComplete) {
                  setTimeout(() => {
                    // Remove all spinners and mount points after video transition completes
                    const spinnerMounts = imgParent.querySelectorAll('[data-mesulo-loading-spinner="true"]');
                    spinnerMounts.forEach(mount => {
                      try {
                        if (mount.parentElement) {
                          mount.parentElement.removeChild(mount);
                        }
                      } catch (e) {
                        // Ignore errors
                      }
                    });
                    
                    const allSpinners = imgParent.querySelectorAll('.mesulo-video-update-spinner, .mesulo-spinner');
                    allSpinners.forEach(spinner => {
                      try {
                        if (spinner.parentElement) {
                          spinner.parentElement.removeChild(spinner);
                        }
                      } catch (e) {
                        // Ignore errors
                      }
                    });
                    
                    // Remove image from DOM after video transition completes
                    if (imgElement && imgElement.parentElement) {
                      imgElement.parentElement.removeChild(imgElement);
                    }
                    onComplete(videoElement);
                  }, 2000);
                }
              });
            }
          }
        }, 600);
      }, 1000); // Changed from 3000 to 1000 - spinner runs for 1 second
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

