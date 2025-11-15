import { loadVideoWithSpinner } from './videoLoader.js';
import { gameVideoStore } from '../store/gameVideoStore.js';

const BATCH_SIZE = 10;
const BATCH_DELAY = 50;

const processingSet = new Set();
const processedSet = new Set();

function processGameElement(containerElement) {
  const gameId = containerElement.getAttribute('data-mesulo-game-id');
  if (!gameId) return;

  if (processedSet.has(gameId) || processingSet.has(gameId)) {
    return;
  }

  if (containerElement.querySelector('video[data-mesulo-game-id]')) {
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

  gameVideoStore.setVideoState(gameId, {
    id: gameId,
    videoRef: null,
    poster,
    src: null,
    version,
    loading: true,
    type
  });

  const cleanup = loadVideoWithSpinner(
    imgElement,
    gameId,
    className,
    style,
    (videoElement) => {
      if (videoElement) {
        gameVideoStore.updateVideoState(gameId, {
          videoRef: videoElement,
          src: videoElement.src || null,
          loading: false
        });
      }
      processingSet.delete(gameId);
      processedSet.add(gameId);
    }
  );

  return cleanup;
}

function processBatch(elements, startIndex) {
  const endIndex = Math.min(startIndex + BATCH_SIZE, elements.length);
  
  for (let i = startIndex; i < endIndex; i++) {
    const element = elements[i];
    if (element && element.nodeType === 1) {
      processGameElement(element);
    }
  }

  if (endIndex < elements.length) {
    setTimeout(() => {
      processBatch(elements, endIndex);
    }, BATCH_DELAY);
  }
}

export function processAllGames() {
  const allGameElements = document.querySelectorAll('[data-mesulo-game-id]');
  
  if (allGameElements.length === 0) return;

  const elementsToProcess = Array.from(allGameElements).filter(el => {
    const gameId = el.getAttribute('data-mesulo-game-id');
    return gameId && !processedSet.has(gameId) && !processingSet.has(gameId);
  });

  if (elementsToProcess.length === 0) return;

  processBatch(elementsToProcess, 0);
}

export { processGameElement };

