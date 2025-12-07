import { getGameAssets } from '../utils/getGameAssets.js';
import { gameVideoStore } from '../store/gameVideoStore.js';

export function useInitialLoad() {
    const loadResources = (data) => {
      if (!data || !data.games || !Array.isArray(data.games)) {
        return;
      }

      
      data.games.forEach(game => {
        if (!game.id) return;
    
        const currentState = gameVideoStore.getVideoState(game.id);
        const newVersion = game.version || '0';
        
        // Skip if already loaded with same version
        if (currentState && currentState.version === newVersion) {
          return;
        }
        
        const { imageUrl, videoUrl, defaultImage } = getGameAssets(game);
        
        gameVideoStore.setVideoState(game.id, {
          id: game.id,
          videoRef: currentState?.videoRef || null,
          containerRef: currentState?.containerRef || null,
          spinnerRef: currentState?.spinnerRef || null,
          defaultImage: defaultImage || null,
          poster: imageUrl || null,
          src: videoUrl || null,
          version: newVersion,
          loading: false,
          published: game.published || false,
          animate: game.animate !== undefined ? game.animate : true,
          hover: game.hover !== undefined ? game.hover : true,
          type: game.publishedType || 'default',
        });
      });
    };
    return loadResources;
}