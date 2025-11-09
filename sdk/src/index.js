import { MesuloSDK } from './sdk/core.js';
import { VideoManager } from './components/video-manager.js';

function upgradeAllElements() {

  const elements = document.querySelectorAll('[data-mesulo-game-id]');
  elements.forEach(element => {
    upgradeElement(element);
  });
}

function upgradeElement(element) {
  if (!element.hasAttribute('data-mesulo-game-id')) return;

  const gameId = element.getAttribute('data-mesulo-game-id');

  const manager = new VideoManager(element, gameId);

  if (window.mesulo) {
    window.mesulo.registerGameCard(manager, gameId);
  }
}

function init() {
  const script = document.currentScript ||
    document.querySelector('script[data-application-key]');

  if (script?.dataset.applicationKey) {
    const mesuloSDK = new MesuloSDK({
      applicationKey: script.dataset.applicationKey,
      debug: script.dataset.debug === 'true'
    });
    window.mesulo = mesuloSDK;
  }

  upgradeAllElements();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
