import { signal, computed } from '@preact/signals';

export const promotions = signal([]);

function isPromotionActive(promotion) {
  if (!promotion.startDate || !promotion.endDate || !promotion.published) {
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

export const activePromotions = computed(() => {
  return promotions.value.filter(promo => isPromotionActive(promo));
});

function findGamesInGroup(groupElement) {
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
  }
  
  return gameElements;
}

export const promotionsStore = {
  setPromotions(promoArray) {
    if (!promoArray || !Array.isArray(promoArray)) {
      promotions.value = [];
      return;
    }
    promotions.value = promoArray;
  },
  
  getPromotionsForGame(gameId) {
    if (!gameId) return null;
    
    const active = activePromotions.value;
    if (!active.length) return null;
    
    for (const promotion of active) {
      if (!promotion.games || !Array.isArray(promotion.games)) {
        continue;
      }
      
      const promoGame = promotion.games.find(g => g.gameCmsId === gameId);
      if (promoGame) {
        return {
          promoImage: promoGame.promoImage || null,
          promoVideo: promoGame.promoVideo || null
        };
      }
    }
    
    return null;
  },
  
  getAffectedGameIds() {
    const affectedIds = [];
    const active = activePromotions.value;
    
    if (!active.length) return affectedIds;
    
    active.forEach(promotion => {
      if (!promotion.group) return;
      
      const groupElements = document.querySelectorAll(`[data-mesulo-group="${promotion.group}"]`);
      
      groupElements.forEach(groupElement => {
        const gameElements = findGamesInGroup(groupElement);
        
        gameElements.forEach(gameElement => {
          const gameId = gameElement.getAttribute('data-mesulo-game-id');
          if (gameId && !affectedIds.includes(gameId)) {
            if (promotion.games && promotion.games.some(g => g.gameCmsId === gameId)) {
              affectedIds.push(gameId);
            }
          }
        });
      });
    });
    
    return affectedIds;
  },
  
  isPromotionActive(promotion) {
    return isPromotionActive(promotion);
  }
};

