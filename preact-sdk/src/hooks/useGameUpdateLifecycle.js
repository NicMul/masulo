import { getGameAssets } from '../utils/getGameAssets.js';
import { gameVideoStore } from '../store/gameVideoStore.js';

export function useGameUpdateLifecycle() {
  const handleGameUpdate = (data) => {
    if (!data?.games || !Array.isArray(data.games)) {
      return;
    }
    
    data.games.forEach(game => {
      const currentState = gameVideoStore.getVideoState(game.id);
      
      // Only update if video element exists (game was initially loaded)
      if (!currentState || !currentState.videoRef) {
        return;
      }
      
      const newVersion = game.version || '0';
      const newPublished = game.published || false;
      
      // Skip if version AND published state haven't changed
      if (currentState.version === newVersion && 
          currentState.published === newPublished) {
        return;
      }
      
      // Get assets (respects published state)
      const { imageUrl, videoUrl } = getGameAssets(game);
      
      // Add 1-second delay to debounce rapid updates
      setTimeout(() => {
        const videoEl = currentState.videoRef;
        if (!videoEl) return;
        
        const startTime = Date.now();
        
        // Phase 1: Prepare transition
        // Update base-image to new poster and show spinner
        gameVideoStore.updateVideoState(game.id, {
          poster: imageUrl,
          version: newVersion,
          published: newPublished,
          animate: game.animate !== undefined ? game.animate : true,
          hover: game.hover !== undefined ? game.hover : true,
          type: game.publishedType || 'default',
          loading: true
        });
        
        // Phase 2: Fade out current video
        videoEl.style.transition = 'opacity 0.5s ease-in-out';
        videoEl.style.opacity = '0';
        
        // Phase 3: Load new video (after fade out)
        setTimeout(() => {
          // Get updated state to check animate flag
          const updatedState = gameVideoStore.getVideoState(game.id);
          
          // Update video src - only if animate is true
          if (videoUrl && updatedState?.animate !== false) {
            videoEl.src = videoUrl;
            videoEl.load();
            
            // Wait for video to be ready
            const handleCanPlay = () => {
              videoEl.removeEventListener('canplay', handleCanPlay);
              
              // Phase 4: Fade in new video
              requestAnimationFrame(() => {
                videoEl.style.transition = 'opacity 2s ease-in-out';
                videoEl.style.opacity = '1';
                
                // Phase 5: Complete (after 2s minimum from start)
                const elapsed = Date.now() - startTime;
                const remainingTime = Math.max(2000 - elapsed, 0);
                
                setTimeout(() => {
                  gameVideoStore.updateVideoState(game.id, { loading: false });
                }, remainingTime);
              });
            };
            
            videoEl.addEventListener('canplay', handleCanPlay);
            
            // Fallback if canplay doesn't fire
            setTimeout(() => {
              videoEl.removeEventListener('canplay', handleCanPlay);
              videoEl.style.transition = 'opacity 2s ease-in-out';
              videoEl.style.opacity = '1';
              
              const elapsed = Date.now() - startTime;
              const remainingTime = Math.max(2000 - elapsed, 0);
              
              setTimeout(() => {
                gameVideoStore.updateVideoState(game.id, { loading: false });
              }, remainingTime);
            }, 3000);
          } else if (updatedState?.animate === false) {
            // animate is false - only show poster
            videoEl.src = '';
            videoEl.style.opacity = '0';
            
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(2000 - elapsed, 0);
            
            setTimeout(() => {
              gameVideoStore.updateVideoState(game.id, { loading: false });
            }, remainingTime);
          } else {
            // No video (unpublished) - just show poster
            videoEl.src = '';
            videoEl.style.opacity = '0';
            
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(2000 - elapsed, 0);
            
            setTimeout(() => {
              gameVideoStore.updateVideoState(game.id, { loading: false });
            }, remainingTime);
          }
        }, 500); // Wait for fade out to complete
      }, 1000); // 1-second delay
    });
  };
  
  return { handleGameUpdate };
}

