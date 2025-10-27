// Main entry point for the Mesulo Game Components SDK
// This SDK automatically detects and upgrades existing HTML elements

import { GameCardManager } from './components/game-card-manager.js';
import { MesuloSDK } from './sdk/core.js';

// Track upgraded elements to avoid double-processing
const upgradedManagers = new Map();

/**
 * Upgrades a single element with data-masulo-game-id to use GameCardManager
 */
function upgradeElement(element) {
  // Skip if already upgraded or not a valid element
  if (!element.hasAttribute('data-masulo-game-id')) {
    return;
  }

  // Extract game ID
  const gameId = element.getAttribute('data-masulo-game-id');
  
  // Skip if already has a manager
  if (upgradedManagers.has(element)) {
    return;
  }

  // Create game card manager for this element
  const manager = new GameCardManager(element, gameId);
  
  // Register manager with SDK
  if (window.mesulo) {
    window.mesulo.registerGameCard(manager, gameId);
  }
  
  // Store manager reference
  upgradedManagers.set(element, manager);
  
  console.log(`[Mesulo SDK] Upgraded game card: ${gameId}`);
}

/**
 * Scans the DOM and upgrades all matching elements
 */
function upgradeAllElements() {
  const elements = document.querySelectorAll('[data-masulo-game-id]');
  console.log(`[Mesulo SDK] Found ${elements.length} elements to upgrade`);
  
  elements.forEach(element => {
    try {
      upgradeElement(element);
    } catch (error) {
      console.error('[Mesulo SDK] Error upgrading element:', error, element);
    }
  });
}

/**
 * Set up MutationObserver to handle dynamically added content
 */
// function observeDynamicContent() {
//   const observer = new MutationObserver((mutations) => {
//     mutations.forEach((mutation) => {
//       // Check added nodes
//       mutation.addedNodes.forEach((node) => {
//         if (node.nodeType === Node.ELEMENT_NODE) {
//           const element = node;
          
//           // Check if the node itself needs upgrading
//           if (element.hasAttribute && element.hasAttribute('data-masulo-game-id')) {
//             upgradeElement(element);
//           }
          
//           // Check children
//           if (element.querySelectorAll) {
//             const children = element.querySelectorAll('[data-masulo-game-id]:not(game-card)');
//             children.forEach(child => upgradeElement(child));
//           }
//         }
//       });
//     });
//   });

//   // Start observing the document body for changes
//   observer.observe(document.body, {
//     childList: true,
//     subtree: true
//   });

//   console.log('[Mesulo SDK] MutationObserver initialized');
// }

// Global SDK instance
let sdkInstance = null;

/**
 * Initialize the SDK
 */
function init() {
  console.log('[Mesulo SDK] Initializing...');
  
  // Initialize SDK from script tag
  const script = document.currentScript || 
                 document.querySelector('script[data-application-key]');
  
  if (script?.dataset.applicationKey) {
    sdkInstance = new MesuloSDK({
      applicationKey: script.dataset.applicationKey
    });
    
    // Expose globally
    window.mesulo = sdkInstance;
    console.log('[Mesulo SDK] SDK instance created and exposed as window.mesulo');
  } else {
    console.warn('[Mesulo SDK] No application key found. SDK will not connect to server.');
  }
  
  // Upgrade existing elements
  upgradeAllElements();
  
  // Watch for dynamic content
  // observeDynamicContent();
  
  console.log('[Mesulo SDK] Ready');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already ready
  init();
}

// Export for manual control if needed
export { upgradeElement, upgradeAllElements, init, sdkInstance };
