const { Server } = require('socket.io');
const user = require('../model/user');
const getGamesById = require('../services/realtime');

let io = null;

// Initialize Socket.IO server
function initializeSocketIO(server) {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://www.mesulo.com', 'https://mesulo.b-cdn.net']
    : ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:8080'];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const applicationKey = socket.handshake.auth.applicationKey;
      
      if (!applicationKey) {
        return next(new Error('ApplicationKey is required'));
      }
      
      const userData = await user.get({ id: applicationKey });
      
      if (!userData) {
        return next(new Error('Invalid ApplicationKey'));
      }
      
      socket.userData = userData;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Socket connection handling
  io.on('connection', (socket) => {
    const applicationKey = socket.handshake.auth.applicationKey;
    const userData = socket.userData;
    
    console.log(`User ${applicationKey} (${userData.name}) connected`);
    
    // Handle SDK events
    socket.on('sdk-event', async (data) => {
      try {
        if (data.event === 'get-games') {
          await getGamesById(data.data.gameIds, userData.id, socket);
        }
      } catch (error) {
        console.error('Error processing SDK event:', error);
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`User ${applicationKey} disconnected`);
    });
  });

  return io;
}

module.exports = {
  initializeSocketIO
};