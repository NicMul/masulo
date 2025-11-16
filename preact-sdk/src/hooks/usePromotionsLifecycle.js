import { getGameAssets } from '../utils/getGameAssets.js';
import { gameVideoStore } from '../store/gameVideoStore.js';
import { promotionsStore } from '../store/promotionsStore.js';

export function usePromotionsLifecycle() {

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

  const phase1_prepare = (gameId, newVersion, game, videoEl) => {
    videoEl.style.opacity = '0';
   
    
    gameVideoStore.updateVideoState(gameId, {
      version: newVersion,
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
    videoEl.style.filter = 'blur(0)';
    gameVideoStore.updateVideoState(gameId, { 
      loading: false,
      baseImageSrc: imageUrl
    });

    return true;

  };

  const handlePromotionsUpdate = (promotionsData, gamesData) => {
    if (!promotionsData || !Array.isArray(promotionsData)) {
      promotionsData = [];
    }
    
    if (gamesData && Array.isArray(gamesData)) {
      promotionsStore.updateGameMapping(gamesData);
    }
    
    const previouslyAffectedGameIds = promotionsStore.getAffectedGameIds();
    promotionsStore.setPromotions(promotionsData);
    const newlyAffectedGameIds = promotionsStore.getAffectedGameIds();
    
    const gamesToRevert = previouslyAffectedGameIds.filter(gameId => 
      !newlyAffectedGameIds.includes(gameId)
    );
    
    const allGamesToUpdate = [...new Set([...gamesToRevert, ...newlyAffectedGameIds])];
    
    if (allGamesToUpdate.length === 0) {
      return;
    }
    
    allGamesToUpdate.forEach(gameId => {
      const currentState = gameVideoStore.getVideoState(gameId);
      if (!currentState || !currentState.videoRef) {
        return;
      }
      
      let game = null;
      if (gamesData && Array.isArray(gamesData)) {
        game = gamesData.find(g => g.id === gameId);
      }
      
      if (!game) {
        return;
      }
      
      const { imageUrl, videoUrl } = getGameAssets(game);
      const videoEl = currentState.videoRef;
      const newVersion = (parseInt(currentState.version || '0') + 1).toString();
      
      (async () => {
        await waitFor(1000); 
        if (!videoEl) return;
        
        phase1_prepare(gameId, newVersion, game, videoEl);
        
        await waitFor(3000);
        
        await phase2_loadVideo(gameId, videoEl, videoUrl, imageUrl);
        
        phase3_complete(gameId, imageUrl, videoEl);
      })();
    });
  };
  
  return { handlePromotionsUpdate };
}

