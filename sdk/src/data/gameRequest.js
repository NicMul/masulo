import { gameVideoStore } from '../store/gameVideoStore.js';

export function requestGames(connectionManager) {
  const gameIdsFromStore = gameVideoStore.getAllVideos().map(video => video.id);
  
  const gameIdsFromDOM = Array.from(document.querySelectorAll('[data-mesulo-game-id]'))
    .map(el => el.getAttribute('data-mesulo-game-id'))
    .filter(id => id);
  
  const allGameIds = [...new Set([...gameIdsFromStore, ...gameIdsFromDOM])];
  
  if (allGameIds.length === 0) {
    return;
  }
  
  const socket = connectionManager.getSocket();
  if (!socket || !connectionManager.isConnected) {
    return;
  }
  
  socket.emit('join-game-rooms', {
    gameIds: allGameIds,
    timestamp: new Date().toISOString()
  });
  
  socket.emit('sdk-event', {
    event: 'get-games',
    data: { gameIds: allGameIds },
    timestamp: new Date().toISOString()
  });
}

