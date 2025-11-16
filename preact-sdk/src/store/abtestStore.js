import { signal, computed } from '@preact/signals';

function generateSessionId() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export const abtests = signal([]);
export const sessionId = signal(generateSessionId());

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function isABTestActive(abtest) {
  if (!abtest.startDate || !abtest.endDate || !abtest.published) {
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

export const activeABTests = computed(() => {
  return abtests.value.filter(abtest => isABTestActive(abtest));
});

function determineVariant(gameId) {
  const hashInput = `${sessionId.value}_${gameId}`;
  const hash = hashString(hashInput);
  return hash % 2 === 1 ? 'A' : 'B';
}

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

export const abtestStore = {
  setABTests(abtestsArray) {
    if (!abtestsArray || !Array.isArray(abtestsArray)) {
      abtests.value = [];
      return;
    }
    abtests.value = abtestsArray;
  },
  
  getABTestForGame(gameId) {
    if (!gameId) return null;
    
    const active = activeABTests.value;
    if (!active.length) return null;
    
    for (const abtest of active) {
      if (abtest.gameId !== gameId) continue;
      if (!abtest.group) continue;
      
      const groupElements = document.querySelectorAll(`[data-mesulo-group="${abtest.group}"]`);
      if (groupElements.length === 0) continue;
      
      let isGameInGroup = false;
      groupElements.forEach(groupElement => {
        const gameElements = findGamesInGroup(groupElement);
        gameElements.forEach(gameElement => {
          if (gameElement.getAttribute('data-mesulo-game-id') === gameId) {
            isGameInGroup = true;
          }
        });
      });
      
      if (!isGameInGroup) continue;
      
      const variant = determineVariant(gameId);
      const isVariantA = variant === 'A';
      
      return {
        imageUrl: isVariantA ? abtest.imageVariantA : abtest.imageVariantB,
        videoUrl: isVariantA ? abtest.videoVariantA : abtest.videoVariantB,
        variant: variant,
        creatorId: abtest.userId || abtest.user_id || null
      };
    }
    
    return null;
  },
  
  getAffectedGameIds() {
    const affectedIds = [];
    const active = activeABTests.value;
    
    if (!active.length) return affectedIds;
    
    active.forEach(abtest => {
      if (!abtest.group || !abtest.gameId) return;
      
      const groupElements = document.querySelectorAll(`[data-mesulo-group="${abtest.group}"]`);
      
      groupElements.forEach(groupElement => {
        const gameElements = findGamesInGroup(groupElement);
        
        gameElements.forEach(gameElement => {
          const gameId = gameElement.getAttribute('data-mesulo-game-id');
          if (gameId === abtest.gameId && !affectedIds.includes(gameId)) {
            affectedIds.push(gameId);
          }
        });
      });
    });
    
    return affectedIds;
  },
  
  isABTestActive(abtest) {
    return isABTestActive(abtest);
  }
};

