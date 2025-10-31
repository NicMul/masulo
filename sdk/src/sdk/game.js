/**
 * Game Manager
 * Handles game card registration and game data updates
 */

export class GameManager {
  constructor(connectionManager, analyticsManager) {
    this.connectionManager = connectionManager;
    this.analyticsManager = analyticsManager;
    this.registeredComponents = new Map(); // gameId -> Set<component>
    
    // Set up game update callback in connection manager
    connectionManager.setOnGamesUpdate((games) => {
      this.updateSpecificGames(games);
    });
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
    gamesData.forEach(game => {
      const components = this.registeredComponents.get(game.id);
      if (!components || components.size === 0) {
        return;
      }

      // Determine which assets to use based on publishedType (once per game)
      let imageUrl = game.defaultImage;
      let videoUrl = game.defaultVideo;

      if (!game.published) {
        console.log('[Mesulo SDK] : Game unpublished', game);
        imageUrl = game.defaultImage;
        videoUrl = null;

        // Emit analytics once per game, include game_group
        this.analyticsManager.trackAssetEvent(
          'game_unpublished',
          game.id,
          'defaultImage',
          imageUrl,
          {
            reason: 'game_unpublished',
            reverted_to: 'defaultImage',
            game_group: game.group ?? game.groupId ?? null
          },
          true
        );
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

      // Update all registered components for this game id
      components.forEach(component => {
        const container = component.getContainer ? component.getContainer() : component.container;
        if (!container) {
          return;
        }

        const newVersion = game.version;

        // Store version in DOM for persistence
        container.setAttribute('data-mesulo-version', String(newVersion));

        // Store analytics flag in DOM for persistence
        container.setAttribute('data-mesulo-analytics', String(game.analytics));

        // Apply update to this component
        if (typeof component.updateContent === 'function') {
          component.updateContent(imageUrl, videoUrl, game.published);
        }
      });
    });
  }
  
  // Get registered components for other managers
  getRegisteredComponents() {
    return this.registeredComponents;
  }
}

