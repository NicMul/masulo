/**
 * Promotion Manager
 * Handles promotion data updates and applies them to game cards
 */

export class PromotionManager {
  constructor(connectionManager, gameManager) {
    this.connectionManager = connectionManager;
    this.gameManager = gameManager;
    // Store game data for caching (gameId -> game object)
    this.gamesMap = new Map();
    // Map cmsId to gameId for lookups
    this.cmsIdToIdMap = new Map();
    // Track active promotions: gameId -> { imageUrl, videoUrl }
    this.activePromotionAssets = new Map();
  }
  
  /**
   * Check if current date (in CET) is within the promotion date range
   */
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
      const cetOffset = 1 * 60 * 60 * 1000; // CET is UTC+1
      const cetNow = new Date(now.getTime() + cetOffset);
      
      // Make end date inclusive (include entire end day)
      const endDateInclusive = new Date(endDate.getTime() + (24 * 60 * 60 * 1000));
      
      return cetNow >= startDate && cetNow < endDateInclusive;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Update game data mapping (called when games are received)
   */
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
  
  /**
   * Check if a game has active promotion assets
   * Returns { imageUrl, videoUrl } or null
   */
  getPromotionAssets(gameId, componentElement) {
    return this.activePromotionAssets.get(gameId) || null;
  }

  /**
   * Find game elements associated with a group element by traversing DOM
   * Looks in: direct children, siblings, and parent's descendants
   */
  findGamesInGroup(groupElement) {
    const gameElements = [];
    
    // Strategy 1: Check direct children (if group is a container)
    const directGames = groupElement.querySelectorAll('[data-mesulo-game-id]');
    if (directGames.length > 0) {
      console.log('[Mesulo SDK] Found games in direct children:', directGames.length);
      return Array.from(directGames);
    }
    
    // Strategy 2: Check next siblings until we hit another group or run out
    let sibling = groupElement.nextElementSibling;
    while (sibling) {
      // Stop if we hit another group marker
      if (sibling.hasAttribute('data-mesulo-group')) {
        break;
      }
      
      // Check if this sibling is a game
      if (sibling.hasAttribute('data-mesulo-game-id')) {
        gameElements.push(sibling);
      }
      
      // Check for games within this sibling
      const gamesInSibling = sibling.querySelectorAll('[data-mesulo-game-id]');
      gameElements.push(...Array.from(gamesInSibling));
      
      sibling = sibling.nextElementSibling;
    }
    
    if (gameElements.length > 0) {
      console.log('[Mesulo SDK] Found games in siblings:', gameElements.length);
      return gameElements;
    }
    
    // Strategy 3: Check parent's children that come after the group element
    const parent = groupElement.parentElement;
    if (parent) {
      let foundGroup = false;
      Array.from(parent.children).forEach(child => {
        if (child === groupElement) {
          foundGroup = true;
          return;
        }
        
        if (foundGroup) {
          // Stop if we hit another group
          if (child.hasAttribute('data-mesulo-group')) {
            return;
          }
          
          // Check this child
          if (child.hasAttribute('data-mesulo-game-id')) {
            gameElements.push(child);
          }
          
          // Check within this child
          const gamesInChild = child.querySelectorAll('[data-mesulo-game-id]');
          gameElements.push(...Array.from(gamesInChild));
        }
      });
      
      if (gameElements.length > 0) {
        console.log('[Mesulo SDK] Found games in parent scope:', gameElements.length);
      }
    }
    
    return gameElements;
  }

  /**
   * Update game cards based on promotion data
   */
  updatePromotions(promotionsData) {
    console.log('[Mesulo SDK] updatePromotions called with:', promotionsData);
    
    // Track which games were affected by promotions (before clearing)
    const previouslyAffectedGameIds = Array.from(this.activePromotionAssets.keys());
    
    if (!promotionsData || !Array.isArray(promotionsData)) {
      console.log('[Mesulo SDK] No promotions data or not array');
      // Clear and trigger updates for previously affected games
      this.activePromotionAssets.clear();
      this.triggerGameUpdatesForAffectedGames(previouslyAffectedGameIds);
      return;
    }
    
    // Clear existing active promotions
    this.activePromotionAssets.clear();
    console.log('[Mesulo SDK] Cleared active promotion assets');
    
    // Track which games will have active promotions after processing
    const newlyAffectedGameIds = new Set();
    
    // Process each promotion
    promotionsData.forEach(promotion => {
      console.log('[Mesulo SDK] Processing promotion:', promotion.name);
      
      // Validate date range
      if (!this.isPromotionActive(promotion)) {
        console.log('[Mesulo SDK] Promotion not active (date check failed):', promotion.name);
        return;
      }
      
      console.log('[Mesulo SDK] Promotion is active:', promotion.name);
      
      // Find all group elements matching this promotion's group - exit early if none found
      const groupElements = document.querySelectorAll(`[data-mesulo-group="${promotion.group}"]`);
      console.log(`[Mesulo SDK] Found ${groupElements.length} group elements for group: ${promotion.group}`);
      
      if (groupElements.length === 0) {
        console.log('[Mesulo SDK] No group elements found - exiting early');
        return;
      }
      
      // Process each game in the promotion
      if (!promotion.games || !Array.isArray(promotion.games)) {
        console.log('[Mesulo SDK] No games in promotion');
        return;
      }
      
      console.log(`[Mesulo SDK] Processing ${promotion.games.length} games in promotion`);
      
      // For each group element, find associated games
      groupElements.forEach(groupElement => {
        console.log('[Mesulo SDK] Finding games for group element:', groupElement);
        
        // Find games within this group's scope (NOT entire document)
        const gameElements = this.findGamesInGroup(groupElement);
        console.log(`[Mesulo SDK] Found ${gameElements.length} game elements in group scope`);
        
        if (gameElements.length === 0) {
          console.log('[Mesulo SDK] No games found in this group scope');
          return;
        }
        
        // Log all game IDs found in this group
        const foundGameIds = gameElements.map(el => el.getAttribute('data-mesulo-game-id'));
        console.log('[Mesulo SDK] Game IDs in group:', foundGameIds);
        
        // Process each promo game
        promotion.games.forEach(promoGame => {
          console.log('[Mesulo SDK] Looking for promo game (gameCmsId):', promoGame.gameCmsId);
          
          // Resolve gameCmsId to actual game ID
          // The gameCmsId might be the cmsId (needs mapping) or already the internal ID
          let resolvedGameId = promoGame.gameCmsId;
          
          // Try to resolve via cmsId mapping
          if (this.cmsIdToIdMap.has(promoGame.gameCmsId)) {
            resolvedGameId = this.cmsIdToIdMap.get(promoGame.gameCmsId);
            console.log('[Mesulo SDK] Resolved via cmsIdMap:', promoGame.gameCmsId, '->', resolvedGameId);
          } else {
            console.log('[Mesulo SDK] No cmsId mapping found, using gameCmsId directly:', promoGame.gameCmsId);
          }
          
          let foundMatch = false;
          
          // Find matching game element
          gameElements.forEach(gameElement => {
            const gameId = gameElement.getAttribute('data-mesulo-game-id');
            
            // Check if this game element matches the resolved game ID
            if (gameId === resolvedGameId) {
              console.log('[Mesulo SDK] ✓ MATCH! Game ID:', gameId);
              foundMatch = true;
              
              // Store active promotion assets for this game (use actual gameId from DOM)
              this.activePromotionAssets.set(gameId, {
                imageUrl: promoGame.promoImage || null,
                videoUrl: promoGame.promoVideo || null
              });
              
              // Track this game as newly affected
              newlyAffectedGameIds.add(gameId);
              
              console.log('[Mesulo SDK] Stored promotion assets:', {
                gameId,
                imageUrl: promoGame.promoImage,
                videoUrl: promoGame.promoVideo
              });
              
              // Find the registered component for this game
              const registeredComponents = this.gameManager.getRegisteredComponents();
              const components = registeredComponents.get(gameId);
              
              console.log('[Mesulo SDK] Registered components:', components?.size || 0);
              
              if (components && components.size > 0) {
                components.forEach(component => {
                  const elementToUpdate = component.videoElement || component.element;
                  
                  // Check if the component element matches this game element
                  if (elementToUpdate === gameElement || gameElement.contains(elementToUpdate)) {
                    console.log('[Mesulo SDK] ✓✓ Applying promotion assets!');
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
            console.log('[Mesulo SDK] ✗ NO MATCH found for promo game:', promoGame.gameCmsId, '(resolved to:', resolvedGameId + ')');
            console.log('[Mesulo SDK] cmsIdToIdMap contents:', Array.from(this.cmsIdToIdMap.entries()));
          }
        });
      });
    });
    
    console.log('[Mesulo SDK] Final active promotion assets:', this.activePromotionAssets);
    
    // Find games that were previously affected but are no longer in active promotions
    // These need to revert to default game assets (or AB test assets if applicable)
    const gamesToRevert = previouslyAffectedGameIds.filter(gameId => !newlyAffectedGameIds.has(gameId));
    
    if (gamesToRevert.length > 0) {
      console.log('[Mesulo SDK] Games that need to revert from promotion assets:', gamesToRevert);
      this.triggerGameUpdatesForAffectedGames(gamesToRevert);
    }
    
    // Trigger game updates for newly affected games to ensure promotion assets are applied
    if (newlyAffectedGameIds.size > 0) {
      console.log('[Mesulo SDK] Triggering game updates for newly affected games to apply promotion assets:', Array.from(newlyAffectedGameIds));
      this.triggerGameUpdatesForAffectedGames(Array.from(newlyAffectedGameIds));
    }
  }
  
  /**
   * Trigger game updates for games that were affected by promotion changes
   */
  triggerGameUpdatesForAffectedGames(gameIds) {
    if (!this.gameManager || !gameIds || gameIds.length === 0) {
      return;
    }
    
    console.log('[Mesulo SDK] Triggering game updates for affected games:', gameIds);
    
    // Request game data to trigger updateSpecificGames which will re-evaluate assets
    const socket = this.connectionManager.getSocket();
    if (socket && this.connectionManager.isConnected) {
      socket.emit('sdk-event', {
        event: 'get-games',
        data: { gameIds: gameIds },
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('[Mesulo SDK] Cannot trigger game updates: socket not connected');
    }
  }
}
