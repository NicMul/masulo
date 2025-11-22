/**
 * Request promotions data from the server via socket
 * @param {ConnectionManager} connectionManager - The connection manager instance
 */
export function requestPromotions(connectionManager) {
  const socket = connectionManager.getSocket();
  if (!socket || !connectionManager.isConnected) {
    return;
  }
  
  socket.emit('sdk-event', {
    event: 'get-promotions',
    data: {},
    timestamp: new Date().toISOString()
  });
}

