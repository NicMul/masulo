import { gameVideoStore } from '../store/gameVideoStore.js';

export function requestGames(connectionManager) {
  const allVideos = gameVideoStore.getAllVideos();
  const gameIds = allVideos.map(video => video.id);
  
  if (gameIds.length === 0) {
    return;
  }
  
  const socket = connectionManager.getSocket();
  if (!socket || !connectionManager.isConnected) {
    return;
  }
  
  socket.emit('join-game-rooms', {
    gameIds,
    timestamp: new Date().toISOString()
  });
  
  socket.emit('sdk-event', {
    event: 'get-games',
    data: { gameIds },
    timestamp: new Date().toISOString()
  });
}

