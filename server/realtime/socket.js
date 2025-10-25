const { Server } = require('socket.io');
const user = require('../model/user');
const { getGamesById } = require('../services/realtime');

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
      const clientOrigin = socket.handshake.headers.origin;
      
      console.log('Socket connection attempt:', {
        applicationKey,
        clientOrigin,
        headers: socket.handshake.headers
      });
      
      if (!applicationKey) {
        return next(new Error('ApplicationKey is required'));
      }
      
      const userData = await user.get({ id: applicationKey });
      
      if (!userData) {
        return next(new Error('Invalid ApplicationKey'));
      }
      
      // Extract domain from client origin (remove protocol and port)
      let clientDomain = '';
      if (clientOrigin && clientOrigin !== 'null') {
        try {
          const url = new URL(clientOrigin);
          clientDomain = url.hostname.toLowerCase();
          console.log('Parsed client domain:', clientDomain, 'from origin:', clientOrigin);
        } catch (error) {
          console.log('Failed to parse origin:', clientOrigin, 'error:', error.message);
          return next(new Error('Invalid origin format'));
        }
      } else {
        // Handle file:// protocol, missing origin, or 'null' string (development/testing)
        clientDomain = 'localhost';
        console.log('No valid origin header (null/missing), defaulting to localhost');
      }
      
      // LOCALHOST BYPASS - Remove this block to enforce origin validation in development
      const isDevelopment = ['localhost', '127.0.0.1'].some(host => 
        clientDomain.includes(host));
      if (isDevelopment) {
        console.log('Development mode detected, bypassing origin validation for:', clientDomain);
        socket.userData = userData;
        return next();
      }
      // END LOCALHOST BYPASS
      
      // Origin validation
      console.log('User origin_url:', userData.origin_url);
      if (!userData.origin_url || userData.origin_url.trim() === '') {
        console.log('Origin URL not configured for user:', applicationKey);
        return next(new Error('Origin URL not configured for user'));
      }
      
      // Normalize stored origin_url (remove protocol if present, convert to lowercase)
      let storedDomain = userData.origin_url.toLowerCase().trim();
      console.log('Original stored domain:', storedDomain);
      if (storedDomain.startsWith('http://') || storedDomain.startsWith('https://')) {
        try {
          const url = new URL(storedDomain);
          storedDomain = url.hostname.toLowerCase();
          console.log('Normalized stored domain (with protocol):', storedDomain);
        } catch (error) {
          // If stored origin_url is malformed, use as-is after removing protocol
          storedDomain = storedDomain.replace(/^https?:\/\//, '').split('/')[0];
          console.log('Normalized stored domain (fallback):', storedDomain);
        }
      } else {
        // Remove any trailing paths and ports
        storedDomain = storedDomain.split('/')[0].split(':')[0];
        console.log('Normalized stored domain (no protocol):', storedDomain);
      }
      
      // Subdomain matching logic
      const getRootDomain = (domain) => {
        const parts = domain.split('.');
        if (parts.length >= 2) {
          // Handle cases like .co.uk, .com.au, etc.
          const lastTwo = parts.slice(-2).join('.');
          return lastTwo;
        }
        return domain;
      };
      
      const clientRootDomain = getRootDomain(clientDomain);
      const storedRootDomain = getRootDomain(storedDomain);
      
      console.log('Domain comparison:', {
        clientDomain,
        storedDomain,
        clientRootDomain,
        storedRootDomain
      });
      
      // Check if domains match (exact match or subdomain match)
      const isExactMatch = clientDomain === storedDomain;
      const isSubdomainMatch = clientDomain.endsWith('.' + storedDomain) || 
                              (clientRootDomain === storedRootDomain && 
                               clientDomain !== storedDomain && 
                               storedDomain !== clientRootDomain);
      
      console.log('Match results:', {
        isExactMatch,
        isSubdomainMatch,
        endsWithCheck: clientDomain.endsWith('.' + storedDomain),
        rootDomainMatch: clientRootDomain === storedRootDomain
      });
      
      if (!isExactMatch && !isSubdomainMatch) {
        console.log(`Origin mismatch: client=${clientDomain}, stored=${storedDomain}`);
        return next(new Error('Origin domain does not match user configuration'));
      }
      
      console.log('Origin validation passed for:', clientDomain);
      
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
    
    console.log(`User ${applicationKey} (${userData.name}) connected from ${socket.handshake.headers.origin}`);
    
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

    // Handle game room management
    socket.on('join-game-rooms', (data) => {
      try {
        const { gameIds } = data;
        if (Array.isArray(gameIds)) {
          gameIds.forEach(gameId => {
            const roomName = `game:${gameId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined room: ${roomName}`);
          });
        }
      } catch (error) {
        console.error('Error joining game rooms:', error);
      }
    });

    socket.on('leave-game-rooms', (data) => {
      try {
        const { gameIds } = data;
        if (Array.isArray(gameIds)) {
          gameIds.forEach(gameId => {
            const roomName = `game:${gameId}`;
            socket.leave(roomName);
            console.log(`Socket ${socket.id} left room: ${roomName}`);
          });
        }
      } catch (error) {
        console.error('Error leaving game rooms:', error);
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`User ${applicationKey} disconnected`);
    });
  });

  return io;
}

// Function to emit game updates to specific game rooms
const emitGameUpdate = (gameIds, gamesData) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  gameIds.forEach(gameId => {
    const roomName = `game:${gameId}`;
    const gameData = gamesData.find(game => game.id === gameId);
    
    if (gameData) {
      io.to(roomName).emit('games-updated', {
        success: true,
        games: [gameData],
        count: 1,
        timestamp: new Date().toISOString()
      });
      console.log(`Emitted game update for ${gameId} to room ${roomName}`);
    }
  });
};

module.exports = {
  initializeSocketIO,
  emitGameUpdate,
  getIO: () => io
};