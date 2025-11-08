const { Server } = require('socket.io');
const user = require('../model/user');
const analytics = require('../model/analytics');
const abtestData = require('../model/abtest-data');
const { getGamesById, getPromotions, getABTests } = require('../services/realtime');

let io = null;

// Initialize Socket.IO server
function initializeSocketIO(server) {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://www.mesulo.com', 'https://mesulo.b-cdn.net', 'https://dev.highroller.com']
    : ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:8080', 'https://dev.highroller.com'];

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
    
    // Automatically join user-specific room for promotion updates
    const userRoom = `user:${userData.id}`;
    socket.join(userRoom);
    console.log(`Socket ${socket.id} joined user room: ${userRoom}`);
    
    // Handle SDK events
    socket.on('sdk-event', async (data) => {
      try {
        if (data.event === 'get-games') {
          await getGamesById(data.data.gameIds, userData.id, socket);
        } else if (data.event === 'get-promotions') {
          await getPromotions(userData.id, socket);
        } else if (data.event === 'get-ab-tests') {
          await getABTests(userData.id, socket, io);
        }
      } catch (error) {
        console.error('Error processing SDK event:', error);
      }
    });

    // Handle analytics events
    socket.on('analytics-event', async (data) => {
      try {
        // Validate required fields
        if (!data.event_type || !data.game_id || !data.asset_type || !data.asset_url || !data.session_id) {
          console.warn('Invalid analytics event data:', data);
          return;
        }

        // Add user context
        const analyticsData = {
          ...data,
          user_id: userData.id,
          account_id: userData.id // Using user_id as account_id for now
        };

        // Store analytics event (fire-and-forget for performance)
        analytics.create({ data: analyticsData, user: userData.id, account: userData.id })
          .catch(error => console.error('Error storing analytics event:', error));

      } catch (error) {
        console.error('Error processing analytics event:', error);
      }
    });

    // Handle AB test analytics batch events
    socket.on('abtest-analytics-batch', async (data) => {
      try {
        console.log('[Socket] Received AB test analytics batch:', {
          eventCount: data.events?.length || 0,
          hasEvents: !!data.events,
          isArray: Array.isArray(data.events)
        });
        
        if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
          console.warn('Invalid AB test analytics batch data:', data);
          return;
        }
        
        // Validate all events have required fields
        const validEvents = data.events.filter(event => 
          event.gameId && event.eventType && event.variant && event.device
        );
        
        console.log('[Socket] Valid events:', {
          total: data.events.length,
          valid: validEvents.length,
          invalid: data.events.length - validEvents.length
        });
        
        if (validEvents.length === 0) {
          console.warn('No valid events in AB test analytics batch');
          return;
        }
        
        // Bulk insert (fire-and-forget for performance)
        abtestData.createMany({ 
          events: validEvents, 
          user: userData.id, 
          account: userData.id 
        })
          .then(result => {
            console.log('[Socket] AB test analytics batch stored successfully:', {
              insertedCount: result.insertedCount,
              userId: userData.id
            });
          })
          .catch(error => {
            console.error('Error storing AB test analytics batch:', error);
            console.error('Error details:', {
              message: error.message,
              name: error.name,
              stack: error.stack
            });
          });
          
      } catch (error) {
        console.error('Error processing AB test analytics batch:', error);
      }
    });

    // Handle game room management
    socket.on('join-game-rooms', (data, callback) => {

      console.log('[Socket] : Joining game rooms:', data);
      try {
        const { gameIds } = data;
        const joinedRooms = [];
        
        if (Array.isArray(gameIds)) {
          gameIds.forEach(gameId => {
            const roomName = `game:${gameId}`;
            socket.join(roomName);
            joinedRooms.push(roomName);
            const roomCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
            console.log(`Socket ${socket.id} joined room: ${roomName} | Room count: ${roomCount}`);
          });
        }
        
        // Send acknowledgment back to client
        if (callback && typeof callback === 'function') {
          callback({ 
            success: true, 
            rooms: joinedRooms,
            socketId: socket.id 
          });
        }
      } catch (error) {
        console.error('Error joining game rooms:', error);
        if (callback && typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
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

  console.log('=== emitGameUpdate called ===');
  console.log('Game IDs to update:', gameIds);
  console.log('Game data received:', gamesData?.length, 'game(s)');

  gameIds.forEach(gameId => {
    const roomName = `game:${gameId}`;
    const gameData = gamesData.find(game => game.id === gameId);
    
    console.log(`Processing game ${gameId}:`);
    console.log(`  - Room name: ${roomName}`);
    console.log(`  - Game data found:`, !!gameData);
    
    if (gameData) {
      const payload = {
        success: true,
        games: [gameData],
        count: 1,
        timestamp: new Date().toISOString()
      };
      
      // Check how many sockets are in this room
      const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
      console.log(`  - Sockets in room ${roomName}:`, socketsInRoom?.size || 0);
      if (socketsInRoom) {
        console.log(`  - Socket IDs in room:`, Array.from(socketsInRoom));
      }
      
      io.to(roomName).emit('games-updated', payload);
      console.log(`  ✅ Emitted game update for ${gameId} to room ${roomName}`);
    } else {
      console.log(`  ❌ No game data found for ${gameId}`);
    }
  });
  
  console.log('=== emitGameUpdate complete ===');
};

// Function to emit promotion updates to user-specific room
const emitPromotionUpdate = (userId, promotionsData) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  console.log('=== emitPromotionUpdate called ===');
  console.log('User ID:', userId);
  console.log('Promotion data received:', promotionsData?.length || 0, 'promotion(s)');

  const payload = {
    success: true,
    promotions: promotionsData || [],
    count: promotionsData?.length || 0,
    timestamp: new Date().toISOString()
  };

  // Emit to user-specific room instead of broadcasting to all
  const userRoom = `user:${userId}`;
  const socketsInRoom = io.sockets.adapter.rooms.get(userRoom);
  console.log(`  - Sockets in room ${userRoom}:`, socketsInRoom?.size || 0);
  if (socketsInRoom) {
    console.log(`  - Socket IDs in room:`, Array.from(socketsInRoom));
  }
  
  io.to(userRoom).emit('promotions-updated', payload);
  console.log(`✅ Emitted promotion update to user room ${userRoom}`);
  console.log('=== emitPromotionUpdate complete ===');
};

// Function to emit AB test updates to user-specific room
const emitABTestUpdate = (userId, abtestsData) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  console.log('=== emitABTestUpdate called ===');
  console.log('User ID:', userId);
  console.log('AB Test data received:', abtestsData?.length || 0, 'test(s)');

  const payload = {
    success: true,
    abtests: abtestsData || [],
    count: abtestsData?.length || 0,
    timestamp: new Date().toISOString()
  };

  // Emit to user-specific room instead of broadcasting to all
  const userRoom = `user:${userId}`;
  const socketsInRoom = io.sockets.adapter.rooms.get(userRoom);
  console.log(`  - Sockets in room ${userRoom}:`, socketsInRoom?.size || 0);
  if (socketsInRoom) {
    console.log(`  - Socket IDs in room:`, Array.from(socketsInRoom));
  }
  
  io.to(userRoom).emit('abtests-updated', payload);
  console.log(`✅ Emitted AB test update to user room ${userRoom}`);
  console.log('=== emitABTestUpdate complete ===');
};

module.exports = {
  initializeSocketIO,
  emitGameUpdate,
  emitPromotionUpdate,
  emitABTestUpdate,
  getIO: () => io
};