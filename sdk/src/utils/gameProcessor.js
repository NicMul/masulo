import { loadVideoWithSpinner } from './videoLoader.js';
import { gameVideoStore } from '../store/gameVideoStore.js';

const processingSet = new Set();
const processedSet = new Set();

function processGameElement(containerElement) {
  const gameId = containerElement.getAttribute('data-mesulo-game-id');
  if (!gameId) return;

  if (processedSet.has(gameId) || processingSet.has(gameId)) {
    return;
  }

  if (containerElement.querySelector('video[data-mesulo-id]')) {
    processedSet.add(gameId);
    return;
  }

  const imgElement = containerElement.querySelector('img');
  if (!imgElement) return;

  processingSet.add(gameId);

  const poster = imgElement.src || imgElement.getAttribute('src') || '';
  const version = containerElement.getAttribute('data-mesulo-version') || '0';
  const type = containerElement.getAttribute('data-mesulo-type') || 'default';
  const className = imgElement.className || '';
  const style = imgElement.style.cssText || '';

  const imgParent = imgElement.parentElement;
  if (imgParent && window.getComputedStyle(imgParent).position === 'static') {
    imgParent.style.position = 'relative';
  }

  const spinnerContainer = document.createElement('div');
  spinnerContainer.style.position = 'absolute';
  spinnerContainer.style.bottom = '5px';
  spinnerContainer.style.right = '5px';
  spinnerContainer.style.zIndex = '1000';
  spinnerContainer.style.pointerEvents = 'none';
  imgParent.appendChild(spinnerContainer);
  
  const spinner = document.createElement('div');
  spinner.className = 'mesulo-spinner visible';
  spinnerContainer.appendChild(spinner);

  const cleanup = loadVideoWithSpinner(
    imgElement,
    gameId,
    className,
    style,
    poster,
    version,
    spinnerContainer,
    (videoElement) => {
      processingSet.delete(gameId);
      processedSet.add(gameId);
    }
  );

  return cleanup;
}

export function processAllGames() {
  const allGameElements = document.querySelectorAll('[data-mesulo-game-id]');
  
  if (allGameElements.length === 0) return;

  const elementsToProcess = Array.from(allGameElements).filter(el => {
    const gameId = el.getAttribute('data-mesulo-game-id');
    return gameId && !processedSet.has(gameId) && !processingSet.has(gameId);
  });

  if (elementsToProcess.length === 0) return;

  elementsToProcess.forEach(element => {
    if (element && element.nodeType === 1) {
      processGameElement(element);
    }
  });
}

export { processGameElement };

