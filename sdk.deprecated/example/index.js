

import { MesuloSDK } from '../src/sdk/core.js';
import { VideoManager } from '../src/components/video-manager.js';

const upgradedManagers = new Map();


function upgradeElement(element) {
  if (!element.hasAttribute('data-mesulo-game-id')) {
    return;
  }

  const gameId = element.getAttribute('data-mesulo-game-id');
    
  if (upgradedManagers.has(element)) {
    return;
  }
  

  const manager = new VideoManager(element, gameId);
  

  if (window.mesulo) {
    window.mesulo.registerGameCard(manager, gameId);
  }

  upgradedManagers.set(element, manager);
}


function upgradeAllElements() {
  const elements = document.querySelectorAll('[data-mesulo-game-id]');
  
  elements.forEach(element => {
    try {
      upgradeElement(element);
    } catch (error) {
      console.error('[Mesulo SDK] Error upgrading element:', error, element);
    }
  });
}


let sdkInstance = null;

function init() {

  const script = document.currentScript || 
                 document.querySelector('script[data-application-key]');
  
  if (script?.dataset.applicationKey) {
    sdkInstance = new MesuloSDK({
      applicationKey: script.dataset.applicationKey
    });
    

    window.mesulo = sdkInstance;
  } else {
    console.warn('[Mesulo SDK] No application key found. SDK will not connect to server.');
  }
  

  upgradeAllElements();
  
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  
  init();
}

export { upgradeElement, upgradeAllElements, init, sdkInstance };
