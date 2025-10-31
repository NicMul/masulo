/**
 * Video Manager
 * Handles video playback control and state
 */

export class VideoManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.activeVideoContainer = null;
  }
  
  deactivateAllVideos(resetToStart = true) {
    // Deactivate all registered components, not just the active one
    const registeredComponents = this.gameManager.getRegisteredComponents();
    
    registeredComponents.forEach(componentsSet => {
      if (!componentsSet) return;
      componentsSet.forEach(component => {
        if (typeof component?.deactivate === 'function') {
          component.deactivate(resetToStart);
        }
      });
    });

    this.activeVideoContainer = null;
  }
}

