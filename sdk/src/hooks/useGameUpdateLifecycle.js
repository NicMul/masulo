import { getGameAssets } from '../utils/getGameAssets.js';
import { gameVideoStore } from '../store/gameVideoStore.js';

export function useGameUpdateLifecycle() {

  const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms)); 
  const waitForVideoReady = (videoEl, timeoutMs = 3000) => {
    return new Promise((resolve) => {
      const handleCanPlay = () => {
        videoEl.removeEventListener('canplay', handleCanPlay);
        resolve();
      };
      
      videoEl.addEventListener('canplay', handleCanPlay);
      
      // Fallback timeout
      setTimeout(() => {
        videoEl.removeEventListener('canplay', handleCanPlay);
        resolve();
      }, timeoutMs);
    });
  };

  const phase1_prepare = async (gameId, currentPoster, containerEl, spinnerEl) => {
    // Step 1: Set defaultImage to current poster
    gameVideoStore.updateVideoState(gameId, {
      defaultImage: currentPoster
    });
    
    // Step 2: Fade in container and spinner (1 second)
    if (containerEl && spinnerEl) {
      containerEl.style.opacity = '0';
      spinnerEl.style.opacity = '0';
      containerEl.classList.remove('mesulo-container-hidden');
      spinnerEl.classList.remove('mesulo-spinner-hidden');
      
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      containerEl.style.transition = 'opacity 1s ease-in-out';
      containerEl.style.opacity = '1';
      spinnerEl.style.transition = 'opacity 1s ease-in-out';
      spinnerEl.style.opacity = '1';
      spinnerEl.classList.add('mesulo-spinner-active');
    }
    
    // Wait for fade in to complete
    await waitFor(1000);
  };

  const phase2_fadeOutVideo = async (videoEl) => {
    // Step 3: Fade out video (1 second)
    videoEl.style.transition = 'opacity 1s ease-in-out';
    videoEl.style.opacity = '0';
    
    // Wait for fade out to complete
    await waitFor(1000);
    
    // Step 4: Apply blur immediately (no transition)
    videoEl.style.transition = 'none';
    videoEl.style.filter = 'blur(10px)';
  };

  const phase3_loadVideo = async (gameId, videoEl, videoUrl, imageUrl, newVersion, newPublished, game) => {
    const updatedState = gameVideoStore.getVideoState(gameId);
    
    // Step 5: Update video and poster src immediately
    if (videoUrl && updatedState?.animate !== false) {
      videoEl.src = videoUrl;
      videoEl.poster = imageUrl;
      
      // Update state to keep in sync
      gameVideoStore.updateVideoState(gameId, {
        poster: imageUrl,
        src: videoUrl,
        version: newVersion,
        published: newPublished,
        animate: game.animate !== undefined ? game.animate : true,
        hover: game.hover !== undefined ? game.hover : true,
        type: game.publishedType || 'default',
        loading: true
      });
      
      // Start loading (non-blocking)
      waitForVideoReady(videoEl).then(() => {
        videoEl.load();
      });
      
      return true;
    } else {
      videoEl.src = '';
      gameVideoStore.updateVideoState(gameId, {
        src: ''
      });
      return false;
    }
  };

  const phase4_fadeOutSpinner = async (spinnerEl) => {
    // Spinner has been visible for 2s total (from 0s), now fade out (1s)
    if (spinnerEl) {
      spinnerEl.style.transition = 'opacity 1s ease-in-out';
      spinnerEl.style.opacity = '0';
    }
    
    await waitFor(1000);
  };

  const phase5_fadeInVideo = async (gameId, videoEl, containerEl, spinnerEl) => {
    // Step 6: Fade in video and remove blur (2 seconds)
    await new Promise(resolve => requestAnimationFrame(resolve));
    videoEl.style.transition = 'opacity 2s ease-in-out, filter 2s ease-in-out';
    videoEl.style.opacity = '1';
    videoEl.style.filter = 'blur(0px)';
    
    // Wait for video transition to complete
    await waitFor(2000);
    
    // Clean up
    if (containerEl && spinnerEl) {
      containerEl.classList.add('mesulo-container-hidden');
      spinnerEl.classList.remove('mesulo-spinner-active');
      spinnerEl.classList.add('mesulo-spinner-hidden');
    }
    
    gameVideoStore.updateVideoState(gameId, { 
      loading: false
    });
  };

  // Main handler
  const handleGameUpdate = (data) => {
    if (!data?.games || !Array.isArray(data.games)) {
      return;
    }
    
    data.games.forEach(game => {
      const currentState = gameVideoStore.getVideoState(game.id);
      if (!currentState || !currentState.videoRef) {
        return;
      }
      
      const newVersion = game.version || '0';
      const newPublished = game.published || false;
      
      if (currentState.version === newVersion && 
          currentState.published === newPublished) {
        return;
      }
      
      const { imageUrl, videoUrl } = getGameAssets(game);
      const videoEl = currentState.videoRef;
      const containerEl = currentState.containerRef;
      const spinnerEl = currentState.spinnerRef;
      const currentPoster = currentState.poster;
      
      (async () => {
        if (!videoEl) return;
        
        await phase1_prepare(game.id, currentPoster, containerEl, spinnerEl);
        await phase2_fadeOutVideo(videoEl);
        await phase3_loadVideo(game.id, videoEl, videoUrl, imageUrl, newVersion, newPublished, game);
        await phase4_fadeOutSpinner(spinnerEl);
        await phase5_fadeInVideo(game.id, videoEl, containerEl, spinnerEl);
      })();
    });
  };
  
  return { handleGameUpdate };
}

