export function requestABTests(connectionManager) {
  const socket = connectionManager.getSocket();
  if (!socket || !connectionManager.isConnected) {
    return;
  }

  socket.emit('sdk-event', {
    event: 'get-ab-tests',
    data: {},
    timestamp: new Date().toISOString()
  });
}

