import { getGameAssets } from '../utils/getGameAssets.js';
import { gameVideoStore } from '../store/gameVideoStore.js';

export function useInitialLoad() {
    const loadResources = (data) => {
      if (!data || !data.games || !Array.isArray(data.games)) {
        return;
      }

      
      data.games.forEach(game => {
        if (!game.id) return;
    
        const { imageUrl, videoUrl } = getGameAssets(game);
        const currentState = gameVideoStore.getVideoState(game.id);
        
        gameVideoStore.setVideoState(game.id, {
          id: game.id,
          videoRef: currentState?.videoRef || null, 
          poster: imageUrl || null,
          src: videoUrl || null,
          version: game.version || '0',
          loading: false, 
          type: game.publishedType || 'default',
        });
      });
    };
    return loadResources;
}