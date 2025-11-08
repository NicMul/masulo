/**
 * Game Manager
 * Handles game card registration and game data updates
 */

export class GameManager {
  constructor(connectionManager, analyticsManager, promotionManager = null) {
    this.connectionManager = connectionManager;
    this.analyticsManager = analyticsManager;
    this.promotionManager = promotionManager;
    this.abtestManager = null;
    this.registeredComponents = new Map(); // gameId -> Set<component>

    
    connectionManager.setOnGamesUpdate((games) => {
      this.updateSpecificGames(games);
    });
  }
  
  /**
   * Set the promotion manager reference (called after PromotionManager is created)
   */
  setPromotionManager(promotionManager) {
    this.promotionManager = promotionManager;
  }
  
  /**
   * Set the AB test manager reference (called after ABTestManager is created)
   */
  setABTestManager(abtestManager) {
    this.abtestManager = abtestManager;
  }
  
  registerGameCard(component, gameId) {
    const set = this.registeredComponents.get(gameId) || new Set();
    set.add(component);
    this.registeredComponents.set(gameId, set);
    
    // If already connected, request game data immediately
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
    
    // Join game rooms for real-time updates
    socket.emit('join-game-rooms', {
      gameIds,
      timestamp: new Date().toISOString()
    });
    
    // Request initial game data
    socket.emit('sdk-event', {
      event: 'get-games',
      data: { gameIds },
      timestamp: new Date().toISOString()
    });
  }
  
  updateSpecificGames(gamesData) {
    // Update promotion manager's game mapping if available
    if (this.promotionManager && typeof this.promotionManager.updateGamesMap === 'function') {
      this.promotionManager.updateGamesMap(gamesData);
    }
    
    // Update AB test manager's game mapping if available
    if (this.abtestManager && typeof this.abtestManager.updateGamesMap === 'function') {
      this.abtestManager.updateGamesMap(gamesData);
    }
    
    gamesData.forEach(game => {
      const components = this.registeredComponents.get(game.id);

      if (!components || components.size === 0) {
        return;
      }

      // Check for active promotions first - promotions take precedence
      components.forEach(component => {
        const elementToUpdate = component.videoElement || component.element;
        
        // Check if there's an active promotion for this game/component
        let imageUrl = null;
        let videoUrl = null;
        let usePromotionAssets = false;
        
        if (this.promotionManager) {
          const promotionAssets = this.promotionManager.getPromotionAssets(game.id, elementToUpdate);
          if (promotionAssets) {
            // Use promotion assets - they take precedence over all game asset types
            usePromotionAssets = true;
            imageUrl = promotionAssets.imageUrl;
            videoUrl = promotionAssets.videoUrl;
          }
        }
        
        // If no promotion assets, check for AB test assets
        let useABTestAssets = false;
        let abtestVariant = 'A';
        if (!usePromotionAssets && this.abtestManager) {
          const abtestAssets = this.abtestManager.getABTestAssets(game.id, elementToUpdate);
          if (abtestAssets) {
            // Use AB test assets - they take precedence over game assets
            useABTestAssets = true;
            imageUrl = abtestAssets.imageUrl;
            videoUrl = abtestAssets.videoUrl;
            abtestVariant = abtestAssets.variant || 'A';
          }
        }
        
        // If no promotion or AB test assets, use game's own assets based on publishedType
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

        // Update the component
        const variant = useABTestAssets ? abtestVariant : 'A';
        const forceDelay = useABTestAssets; // Always use delay for AB test assets
        component.replaceImage(elementToUpdate, game.id, videoUrl, imageUrl, variant, forceDelay);
      });
    });
  }
  
  // Get registered components for other managers
  getRegisteredComponents() {
    return this.registeredComponents;
  }
}

