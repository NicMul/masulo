/**
 * AB Test Manager
 * Handles AB test data updates and applies them to game cards
 */

import { ABTestAnalytics } from './analytics/ab.analytics.js';

export class ABTestManager {
  constructor(connectionManager, gameManager) {
    this.connectionManager = connectionManager;
    this.gameManager = gameManager;
    // Store game data for caching (gameId -> game object)
    this.gamesMap = new Map();
    // Track active AB tests: gameId -> { imageUrl, videoUrl }
    this.activeABTestAssets = new Map();
    // Initialize analytics tracker
    this.analytics = new ABTestAnalytics(
      (gameId) => this.activeABTestAssets.has(gameId),
      this.connectionManager
    );
  }
  
  /**
   * Hash a string to a number (deterministic)
   * Improved hash function for better distribution
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Use absolute value and ensure we get good distribution
    return Math.abs(hash);
  }
  
  /**
   * Determine variant based on session ID and game ID hash
   */
  determineVariant(gameId) {
    // Get sessionId from analyticsManager (unique per browser session)
    const sessionId = this.gameManager?.analyticsManager?.sessionId;
    
    if (!sessionId) {
      console.warn('[Mesulo SDK] No sessionId available, defaulting to Variant A');
      return 'A';
    }
    
    // Create deterministic hash input using sessionId instead of applicationKey
    const hashInput = `${sessionId}_${gameId}`;
    const hash = this.hashString(hashInput);
    
    // Odd hash = Variant A, Even hash = Variant B
    const variant = hash % 2 === 1 ? 'A' : 'B';
    
    console.log('[Mesulo SDK] Variant determination:', {
      sessionId,
      gameId,
      hashInput,
      hash,
      variant
    });
    
    return variant;
  }
  
  /**
   * Check if current date (in CET) is within the AB test date range
   */
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
    });
  }
  
  /**
   * Check if a game has active AB test assets
   * Returns { imageUrl, videoUrl } or null
   */
  getABTestAssets(gameId, componentElement) {
    return this.activeABTestAssets.get(gameId) || null;
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
   * Update game cards based on AB test data
   */
  updateABTests(abtestsData) {
    console.log('[Mesulo SDK] updateABTests called with:', abtestsData);
    
    // Track which games were affected by AB tests (before clearing)
    const previouslyAffectedGameIds = Array.from(this.activeABTestAssets.keys());
    
    if (!abtestsData || !Array.isArray(abtestsData)) {
      console.log('[Mesulo SDK] No AB tests data or not array');
      // Clear and trigger updates for previously affected games
      this.activeABTestAssets.clear();
      this.triggerGameUpdatesForAffectedGames(previouslyAffectedGameIds);
      return;
    }
    
    // Clear existing active AB tests
    this.activeABTestAssets.clear();
    console.log('[Mesulo SDK] Cleared active AB test assets');
    
    // Track which games will have active AB tests after processing
    const newlyAffectedGameIds = new Set();
    
    // Process each AB test
    abtestsData.forEach(abtest => {
      console.log('[Mesulo SDK] Processing AB test:', abtest.name);
      
      // Validate date range
      if (!this.isABTestActive(abtest)) {
        console.log('[Mesulo SDK] AB test not active (date check failed):', abtest.name);
        return;
      }
      
      console.log('[Mesulo SDK] AB test is active:', abtest.name);
      
      // Find all group elements matching this AB test's group - exit early if none found
      const groupElements = document.querySelectorAll(`[data-mesulo-group="${abtest.group}"]`);
      console.log(`[Mesulo SDK] Found ${groupElements.length} group elements for group: ${abtest.group}`);
      
      if (groupElements.length === 0) {
        console.log('[Mesulo SDK] No group elements found - exiting early');
        return;
      }
      
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
        
        // Find matching game element by gameId (direct match, no cmsId resolution needed)
        gameElements.forEach(gameElement => {
          const gameId = gameElement.getAttribute('data-mesulo-game-id');
          
          // Check if this game element matches the AB test's gameId
          if (gameId === abtest.gameId) {
            console.log('[Mesulo SDK] ✓ MATCH! Game ID:', gameId);
            
            // Check if there's an active promotion for this game - promotions take precedence
            if (this.gameManager && this.gameManager.promotionManager) {
              const promotionAssets = this.gameManager.promotionManager.getPromotionAssets(gameId, gameElement);
              if (promotionAssets) {
                console.log('[Mesulo SDK] Promotion exists for this game - skipping AB test');
                return;
              }
            }
            
            // Determine variant based on session ID + game ID hash (deterministic)
            const variant = this.determineVariant(gameId);
            const isVariantA = variant === 'A';
            
            // Store active AB test assets for this game with variant info
            this.activeABTestAssets.set(gameId, {
              imageUrl: isVariantA ? (abtest.imageVariantA || null) : (abtest.imageVariantB || null),
              videoUrl: isVariantA ? (abtest.videoVariantA || null) : (abtest.videoVariantB || null),
              variant: variant
            });
            
            // Track this game as newly affected
            newlyAffectedGameIds.add(gameId);
            
            console.log('[Mesulo SDK] Stored AB test assets:', {
              gameId,
              variant,
              imageUrl: isVariantA ? abtest.imageVariantA : abtest.imageVariantB,
              videoUrl: isVariantA ? abtest.videoVariantA : abtest.videoVariantB
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
                  console.log('[Mesulo SDK] ✓✓ Applying AB test assets (Variant', variant + ')!');
                  // forceDelay=true ensures spinner always shows for AB test assets, even on page refresh
                  component.replaceImage(
                    elementToUpdate,
                    gameId,
                    isVariantA ? (abtest.videoVariantA || null) : (abtest.videoVariantB || null),
                    isVariantA ? (abtest.imageVariantA || null) : (abtest.imageVariantB || null),
                    variant,
                    true // forceDelay - always show spinner for AB test assets
                  );
                }
              });
            }
          }
        });
      });
    });
    
    console.log('[Mesulo SDK] Final active AB test assets:', this.activeABTestAssets);
    
    // Setup analytics tracking if we have active AB tests
    if (this.activeABTestAssets.size > 0) {
      this.analytics.setup();
    } else {
      // Clean up analytics if no active AB tests
      this.analytics.cleanup();
    }
    
    // Find games that were previously affected but are no longer in active AB tests
    // These need to revert to default game assets
    const gamesToRevert = previouslyAffectedGameIds.filter(gameId => !newlyAffectedGameIds.has(gameId));
    
    if (gamesToRevert.length > 0) {
      console.log('[Mesulo SDK] Games that need to revert from AB test assets:', gamesToRevert);
      this.triggerGameUpdatesForAffectedGames(gamesToRevert);
    }
    
    // IMPORTANT: Trigger game updates for newly affected games to ensure AB test assets take priority
    // This handles the case where games loaded before AB tests on page refresh
    // When games load first, they apply normal assets. When AB tests load later, we need to
    // trigger a game update so updateSpecificGames() can re-evaluate and apply AB test assets
    if (newlyAffectedGameIds.size > 0) {
      console.log('[Mesulo SDK] Triggering game updates for newly affected games to apply AB test assets:', Array.from(newlyAffectedGameIds));
      this.triggerGameUpdatesForAffectedGames(Array.from(newlyAffectedGameIds));
    }
  }
  
  /**
   * Trigger game updates for games that were affected by AB test changes
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

