

export class VideoManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.activeVideoContainer = null;
  }
  
  deactivateAllVideos(resetToStart = true) {
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

