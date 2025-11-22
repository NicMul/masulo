

import { ABTestAnalytics } from './analytics/ab.analytics.js';

export class ABTestManager {
  constructor(connectionManager, gameManager) {
    this.connectionManager = connectionManager;
    this.gameManager = gameManager;
    this.gamesMap = new Map();
    this.activeABTestAssets = new Map();
    this.analytics = new ABTestAnalytics(
      (gameId) => this.activeABTestAssets.has(gameId),
      this.connectionManager,
      (gameId) => this.activeABTestAssets.get(gameId)
    );
  }
  
  
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  
  determineVariant(gameId) {
    const sessionId = this.gameManager?.analyticsManager?.sessionId;
    
    if (!sessionId) {
      return 'A';
    }
    
    const hashInput = `${sessionId}_${gameId}`;
    const hash = this.hashString(hashInput);
    
    const variant = hash % 2 === 1 ? 'A' : 'B';
    
    return variant;
  }
  
  
  isABTestActive(abtest) {
    if (!abtest.startDate || !abtest.endDate) {
      return false;
    }
    
    try {
      const startDate = new Date(abtest.startDate);
      const endDate = new Date(abtest.endDate);
      
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
    });
  }
  
  
  getABTestAssets(gameId, componentElement) {
    return this.activeABTestAssets.get(gameId) || null;
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

  
  updateABTests(abtestsData) {
    
    const previouslyAffectedGameIds = Array.from(this.activeABTestAssets.keys());
    
    if (!abtestsData || !Array.isArray(abtestsData)) {
      this.activeABTestAssets.clear();
      this.triggerGameUpdatesForAffectedGames(previouslyAffectedGameIds);
      return;
    }
    
    this.activeABTestAssets.clear();
    
    const newlyAffectedGameIds = new Set();
    
    abtestsData.forEach(abtest => {
      
      if (!this.isABTestActive(abtest)) {
        return;
      }
      
      
      const groupElements = document.querySelectorAll(`[data-mesulo-group="${abtest.group}"]`);
      
      if (groupElements.length === 0) {
        return;
      }
      
      groupElements.forEach(groupElement => {
        
        const gameElements = this.findGamesInGroup(groupElement);
        
        if (gameElements.length === 0) {
          return;
        }
        
        const foundGameIds = gameElements.map(el => el.getAttribute('data-mesulo-game-id'));
        
        gameElements.forEach(gameElement => {
          const gameId = gameElement.getAttribute('data-mesulo-game-id');
          
          if (gameId === abtest.gameId) {
            
            if (this.gameManager && this.gameManager.promotionManager) {
              const promotionAssets = this.gameManager.promotionManager.getPromotionAssets(gameId, gameElement);
              if (promotionAssets) {
                return;
              }
            }
            
            const variant = this.determineVariant(gameId);
            const isVariantA = variant === 'A';
            
            const creatorId = abtest.user_id || abtest.userId || null;
            
            
            this.activeABTestAssets.set(gameId, {
              imageUrl: isVariantA ? (abtest.imageVariantA || null) : (abtest.imageVariantB || null),
              videoUrl: isVariantA ? (abtest.videoVariantA || null) : (abtest.videoVariantB || null),
              variant: variant,
              creatorId: creatorId
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
                    isVariantA ? (abtest.videoVariantA || null) : (abtest.videoVariantB || null),
                    isVariantA ? (abtest.imageVariantA || null) : (abtest.imageVariantB || null),
                    variant,
                    true
                  );
                }
              });
            }
          }
        });
      });
    });
    
    
    if (this.activeABTestAssets.size > 0) {
      this.analytics.setup();
    } else {
      this.analytics.cleanup();
    }
    
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

