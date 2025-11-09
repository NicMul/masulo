

export class PromotionManager {
  constructor(connectionManager, gameManager) {
    this.connectionManager = connectionManager;
    this.gameManager = gameManager;
    this.gamesMap = new Map();
    this.cmsIdToIdMap = new Map();
    this.activePromotionAssets = new Map();
  }
  
  
  isPromotionActive(promotion) {
    if (!promotion.startDate || !promotion.endDate) {
      return false;
    }
    
    try {
      const startDate = new Date(promotion.startDate);
      const endDate = new Date(promotion.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
      }
      
      const now = new Date();
      const cetOffset = 1 * 60 * 60 * 1000;
      const cetNow = new Date(now.getTime() + cetOffset);
      
      const endDateInclusive = new Date(endDate.getTime() + (24 * 60 * 60 * 1000));
      
      return cetNow >= startDate && cetNow < endDateInclusive;
    } catch (error) {
      return false;
    }
  }
  
  
  updateGamesMap(gamesData) {
    if (!gamesData || !Array.isArray(gamesData)) {
      return;
    }
    
    gamesData.forEach(game => {
      this.gamesMap.set(game.id, game);
      
      if (game.cmsId) {
        this.cmsIdToIdMap.set(game.cmsId, game.id);
      }
    });
  }
  
  
  getPromotionAssets(gameId, componentElement) {
    return this.activePromotionAssets.get(gameId) || null;
  }

  
  findGamesInGroup(groupElement) {
    const gameElements = [];
    
    const directGames = groupElement.querySelectorAll('[data-mesulo-game-id]');
    if (directGames.length > 0) {
      return Array.from(directGames);
    }
    
    let sibling = groupElement.nextElementSibling;
    while (sibling) {
      if (sibling.hasAttribute('data-mesulo-group')) {
        break;
      }
      
      if (sibling.hasAttribute('data-mesulo-game-id')) {
        gameElements.push(sibling);
      }
      
      const gamesInSibling = sibling.querySelectorAll('[data-mesulo-game-id]');
      gameElements.push(...Array.from(gamesInSibling));
      
      sibling = sibling.nextElementSibling;
    }
    
    if (gameElements.length > 0) {
      return gameElements;
    }
    
    const parent = groupElement.parentElement;
    if (parent) {
      let foundGroup = false;
      Array.from(parent.children).forEach(child => {
        if (child === groupElement) {
          foundGroup = true;
          return;
        }
        
        if (foundGroup) {
          if (child.hasAttribute('data-mesulo-group')) {
            return;
          }
          
          if (child.hasAttribute('data-mesulo-game-id')) {
            gameElements.push(child);
          }
          
          const gamesInChild = child.querySelectorAll('[data-mesulo-game-id]');
          gameElements.push(...Array.from(gamesInChild));
        }
      });
      
      if (gameElements.length > 0) {
      }
    }
    
    return gameElements;
  }

  
  updatePromotions(promotionsData) {
    
    const previouslyAffectedGameIds = Array.from(this.activePromotionAssets.keys());
    
    if (!promotionsData || !Array.isArray(promotionsData)) {
      this.activePromotionAssets.clear();
      this.triggerGameUpdatesForAffectedGames(previouslyAffectedGameIds);
      return;
    }
    
    this.activePromotionAssets.clear();
    
    const newlyAffectedGameIds = new Set();
    
    promotionsData.forEach(promotion => {
      
      if (!this.isPromotionActive(promotion)) {
        return;
      }
      
      
      const groupElements = document.querySelectorAll(`[data-mesulo-group="${promotion.group}"]`);
      
      if (groupElements.length === 0) {
        return;
      }
      
      if (!promotion.games || !Array.isArray(promotion.games)) {
        return;
      }
      
      
      groupElements.forEach(groupElement => {
        
        const gameElements = this.findGamesInGroup(groupElement);
        
        if (gameElements.length === 0) {
          return;
        }
        
        const foundGameIds = gameElements.map(el => el.getAttribute('data-mesulo-game-id'));
        
        promotion.games.forEach(promoGame => {
          
          let resolvedGameId = promoGame.gameCmsId;
          
          if (this.cmsIdToIdMap.has(promoGame.gameCmsId)) {
            resolvedGameId = this.cmsIdToIdMap.get(promoGame.gameCmsId);
          } else {
          }
          
          let foundMatch = false;
          
          gameElements.forEach(gameElement => {
            const gameId = gameElement.getAttribute('data-mesulo-game-id');
            
            if (gameId === resolvedGameId) {
              foundMatch = true;
              
              this.activePromotionAssets.set(gameId, {
                imageUrl: promoGame.promoImage || null,
                videoUrl: promoGame.promoVideo || null
              });
              
              newlyAffectedGameIds.add(gameId);
              
              const registeredComponents = this.gameManager.getRegisteredComponents();
              const components = registeredComponents.get(gameId);
              
              
              if (components && components.size > 0) {
                components.forEach(component => {
                  const elementToUpdate = component.videoElement || component.element;
                  
                  if (elementToUpdate === gameElement || gameElement.contains(elementToUpdate)) {
                    component.replaceImage(
                      elementToUpdate,
                      gameId,
                      promoGame.promoVideo || null,
                      promoGame.promoImage || null
                    );
                  }
                });
              }
            }
          });
          
          if (!foundMatch) {
          }
        });
      });
    });
    
    
    const gamesToRevert = previouslyAffectedGameIds.filter(gameId => !newlyAffectedGameIds.has(gameId));
    
    if (gamesToRevert.length > 0) {
      this.triggerGameUpdatesForAffectedGames(gamesToRevert);
    }
    
    if (newlyAffectedGameIds.size > 0) {
      this.triggerGameUpdatesForAffectedGames(Array.from(newlyAffectedGameIds));
    }
  }
  
  
  triggerGameUpdatesForAffectedGames(gameIds) {
    if (!this.gameManager || !gameIds || gameIds.length === 0) {
      return;
    }
    
    
    const socket = this.connectionManager.getSocket();
    if (socket && this.connectionManager.isConnected) {
      socket.emit('sdk-event', {
        event: 'get-games',
        data: { gameIds: gameIds },
        timestamp: new Date().toISOString()
      });
    } else {
    }
  }
}
