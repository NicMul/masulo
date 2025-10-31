

import { GameCardManager } from './components/game-card-manager.js';
import { MesuloSDK } from './sdk/core.js';
import { GameCardManager2 } from './components/game-card-manager-2.js';

const upgradedManagers = new Map();

/**
 * Upgrades a single element with data-masulo-game-id to use GameCardManager
 */
function upgradeElement(element) {
  // Skip if already upgraded or not a valid element
  if (!element.hasAttribute('data-mesulo-game-id')) {
    return;
  }

  // Extract game ID
  const gameId = element.getAttribute('data-mesulo-game-id');
  
  // If the element itself is an img tag, use its parent as the container
  let containerElement = element;
  if (element.tagName.toLowerCase() === 'img') {
    containerElement = element.parentElement;
    
    // Skip if no parent or parent is the body tag
    if (!containerElement || containerElement === document.body) {
      console.warn(`[Mesulo SDK] No suitable parent container for img element with game ${gameId}`);
      return;
    }
    
    // Skip if parent is already upgraded to avoid duplicate managers
    if (upgradedManagers.has(containerElement)) {
      return;
    }
  } else {
    // Skip if already has a manager
    if (upgradedManagers.has(element)) {
      return;
    }
  }
 
  const manager2 = new GameCardManager2(containerElement, gameId);

  console.log('[Mesulo SDK] : Manager2:', manager2);



  // const manager = new GameCardManager(containerElement, gameId);
  

  if (window.mesulo) {
    window.mesulo.registerGameCard(manager2, gameId);
  }

  upgradedManagers.set(containerElement, manager2);
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
