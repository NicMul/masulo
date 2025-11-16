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

  const phase1_prepare = (gameId, newVersion, newPublished, game, videoEl) => {
    videoEl.style.opacity = '0';
   
    
    gameVideoStore.updateVideoState(gameId, {
      version: newVersion,
      published: newPublished,
      animate: game.animate !== undefined ? game.animate : true,
      hover: game.hover !== undefined ? game.hover : true,
      type: game.publishedType || 'default',
      loading: true
    });
    
  };

  const phase2_loadVideo = async (gameId, videoEl, videoUrl, imageUrl) => {
    const updatedState = gameVideoStore.getVideoState(gameId);
    videoEl.style.filter = 'blur(10px)';
 

    if (videoUrl && updatedState?.animate !== false) {

      
      videoEl.src = videoUrl;
      videoEl.poster = imageUrl;

      await waitForVideoReady(videoEl);
      videoEl.load(); 

      return true; 
    } else {
      videoEl.src = '';
      return false; 
    }
   
  };

  const phase3_complete = (gameId, imageUrl, videoEl) => {
    videoEl.style.opacity = '1';
    videoEl.style.transition = 'opacity 2s ease-in-out, filter 2s ease-in-out';
    gameVideoStore.updateVideoState(gameId, { 
      loading: false,
      baseImageSrc: imageUrl
    });

    return true;

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
      
      (async () => {
        await waitFor(1000); 
        if (!videoEl) return;
        
        phase1_prepare(game.id, newVersion, newPublished, game, videoEl);
        
        await waitFor(3000);
        
        await phase2_loadVideo(game.id, videoEl, videoUrl, imageUrl);
        
        phase3_complete(game.id, imageUrl, videoEl);
      })();
    });
  };
  
  return { handleGameUpdate };
}

