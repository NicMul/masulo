import { useGameEvents } from '../hooks/useGameEvents.js';

export function GameCardWrapper({ gameId, containerElement, handlers = {} }) {
  useGameEvents(containerElement, gameId, handlers);
  return null;
}

