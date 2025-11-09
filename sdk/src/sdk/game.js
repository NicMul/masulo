

export class GameManager {
  constructor(connectionManager, analyticsManager, promotionManager = null) {
    this.connectionManager = connectionManager;
    this.analyticsManager = analyticsManager;
    this.promotionManager = promotionManager;
    this.abtestManager = null;
    this.registeredComponents = new Map();

    connectionManager.setOnGamesUpdate((games) => {
      this.updateSpecificGames(games);
    });
  }
  
  setPromotionManager(promotionManager) {
    this.promotionManager = promotionManager;
  }
  
  setABTestManager(abtestManager) {
    this.abtestManager = abtestManager;
  }
  
  registerGameCard(component, gameId) {
    const set = this.registeredComponents.get(gameId) || new Set();
    set.add(component);
    this.registeredComponents.set(gameId, set);
    
    if (this.connectionManager.isConnected) {
      this.requestGames();
    }
  }
  
  unregisterGameCard(gameId, component) {
    const set = this.registeredComponents.get(gameId);
    if (!set) return;
    if (component) {
      set.delete(component);
      if (set.size === 0) this.registeredComponents.delete(gameId);
    } else {
      this.registeredComponents.delete(gameId);
    }
  }
  
  requestGames() {
    const socket = this.connectionManager.getSocket();
    if (!socket || !this.connectionManager.isConnected) {
      return;
    }
    
    const gameIds = Array.from(this.registeredComponents.keys());
    
    if (gameIds.length === 0) {
      return;
    }
    
    socket.emit('join-game-rooms', {
      gameIds,
      timestamp: new Date().toISOString()
    });
    
    socket.emit('sdk-event', {
      event: 'get-games',
      data: { gameIds },
      timestamp: new Date().toISOString()
    });
  }
  
  updateSpecificGames(gamesData) {
    if (this.promotionManager && typeof this.promotionManager.updateGamesMap === 'function') {
      this.promotionManager.updateGamesMap(gamesData);
    }
    
    if (this.abtestManager && typeof this.abtestManager.updateGamesMap === 'function') {
      this.abtestManager.updateGamesMap(gamesData);
    }
    
    gamesData.forEach(game => {
      const components = this.registeredComponents.get(game.id);

      if (!components || components.size === 0) {
        return;
      }

      components.forEach(component => {
        const elementToUpdate = component.videoElement || component.element;
        
        let imageUrl = null;
        let videoUrl = null;
        let usePromotionAssets = false;
        
        if (this.promotionManager) {
          const promotionAssets = this.promotionManager.getPromotionAssets(game.id, elementToUpdate);
          if (promotionAssets) {
            usePromotionAssets = true;
            imageUrl = promotionAssets.imageUrl;
            videoUrl = promotionAssets.videoUrl;
          }
        }
        
        let useABTestAssets = false;
        let abtestVariant = 'A';
        if (!usePromotionAssets && this.abtestManager) {
          const abtestAssets = this.abtestManager.getABTestAssets(game.id, elementToUpdate);
          if (abtestAssets) {
            useABTestAssets = true;
            imageUrl = abtestAssets.imageUrl;
            videoUrl = abtestAssets.videoUrl;
            abtestVariant = abtestAssets.variant || 'A';
          }
        }
        
        if (!usePromotionAssets && !useABTestAssets) {
          imageUrl = game.defaultImage;
          videoUrl = game.defaultVideo;

          if (!game.published) {
            imageUrl = game.defaultImage;
            videoUrl = null;

          } else if (game.publishedType === 'current' && game.currentImage) {
            imageUrl = game.currentImage;
            videoUrl = game.currentVideo;
          } else if (game.publishedType === 'theme' && game.themeImage) {
            imageUrl = game.themeImage;
            videoUrl = game.themeVideo;
          } else if (game.publishedType === 'promo' && game.promoImage) {
            imageUrl = game.promoImage;
            videoUrl = game.promoVideo;
          }
        }

        const variant = useABTestAssets ? abtestVariant : 'A';
        const forceDelay = useABTestAssets;
        component.replaceImage(elementToUpdate, game.id, videoUrl, imageUrl, variant, forceDelay);
      });
    });
  }
  
  getRegisteredComponents() {
    return this.registeredComponents;
  }
}

