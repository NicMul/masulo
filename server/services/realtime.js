const game = require('../model/game');
const promotion = require('../model/promotion');
const abtest = require('../model/abtest');

const getGamesById = async (gameIds, userId, socket) => {
    console.log('Processing games request for IDs:', gameIds);
    
    try {
        // Query MongoDB for games with the provided IDs
        const games = await game.getByIds(gameIds);
        
        console.log('Found games:', games);
        console.log('Number of games found:', games.length);
        
        // Send response back to client
        socket.emit('games-response', {
            success: true,
            games: games,
            count: games.length,
            timestamp: new Date().toISOString()
        });
        
        return games;
    } catch (error) {
        console.error('Error fetching games:', error);
        
        // Send error response back to client
        socket.emit('games-response', {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        return [];
    }
}

const getPromotions = async (userId, socket) => {
    try {
      // Fetch promotions from your database/service
      const promotions = await promotion.get({ user: userId });
      
      // Filter out unpublished promotions
      const publishedPromotions = promotions.filter(promo => promo.published === true);
      
      // Emit response back to client
      socket.emit('promotions-response', {
        promotions: publishedPromotions,
        success: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching promotions:', error);
      socket.emit('promotions-response', {
        promotions: [],
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

const emitGameUpdates = async (gameIds, userId, emitGameUpdateFn) => {
    console.log('Emitting game updates for IDs:', gameIds);
    
    try {
        // Query MongoDB for games with the provided IDs
        const games = await game.getByIds(gameIds);
        
        console.log('Found games for update:', games);
        console.log('Number of games found:', games.length);
        
        // Emit updates to specific game rooms
        if (emitGameUpdateFn) {
            emitGameUpdateFn(gameIds, games);
        }
        
        return games;
    } catch (error) {
        console.error('Error emitting game updates:', error);
        return [];
    }
}

const emitPromotionUpdates = async (userId, emitPromotionUpdateFn) => {
    console.log('Emitting promotion updates for user:', userId);
    
    try {
        // Fetch all promotions for the user (including unpublished)
        const allPromotions = await promotion.get({ user: userId });
        
        // Filter out unpublished promotions for the payload
        const publishedPromotions = allPromotions.filter(promo => promo.published === true);
        
        console.log('Found promotions for update:', {
            total: allPromotions?.length || 0,
            published: publishedPromotions?.length || 0,
            unpublished: (allPromotions?.length || 0) - (publishedPromotions?.length || 0)
        });
        
        // Emit updates to game rooms
        // Note: We pass publishedPromotions for the payload, but emitPromotionUpdateFn
        // will extract game IDs from ALL promotions (including unpublished) to ensure
        // all affected game rooms are notified when a promotion is unpublished
        if (emitPromotionUpdateFn) {
            // Pass both all promotions (for game room detection) and published ones (for payload)
            emitPromotionUpdateFn(userId, publishedPromotions, allPromotions);
        }
        
        return publishedPromotions;
    } catch (error) {
        console.error('Error emitting promotion updates:', error);
        return [];
    }
}

const getABTests = async (userId, socket, io) => {
    try {
      // Fetch AB tests from your database/service
      const abtests = await abtest.get({ user: userId });
      
      // Filter out unpublished AB tests
      const publishedABTests = abtests.filter(test => test.published === true);
      
      // Enrich each AB test with room count for its gameId
      const abtestsWithRoomCount = publishedABTests.map(test => {
        if (io) {
          const roomName = `game:${test.gameId}`;
          const roomCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
          return {
            ...test.toObject ? test.toObject() : test,
            roomCount: roomCount
          };
        }
        return test.toObject ? test.toObject() : test;
      });
      
      // Emit response back to client
      socket.emit('abtests-response', {
        abtests: abtestsWithRoomCount,
        success: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching AB tests:', error);
      socket.emit('abtests-response', {
        abtests: [],
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

const emitABTestUpdates = async (userId, emitABTestUpdateFn) => {
    console.log('Emitting AB test updates for user:', userId);
    
    try {
        // Fetch all AB tests for the user
        const abtests = await abtest.get({ user: userId });
        
        // Filter out unpublished AB tests
        const publishedABTests = abtests.filter(test => test.published === true);
        
        console.log('Found AB tests for update:', publishedABTests?.length || 0);
        
        // Emit updates to user-specific room
        if (emitABTestUpdateFn) {
            emitABTestUpdateFn(userId, publishedABTests);
        }
        
        return publishedABTests;
    } catch (error) {
        console.error('Error emitting AB test updates:', error);
        return [];
    }
}

module.exports = {
    getGamesById,
    emitGameUpdates,
    emitPromotionUpdates,
    getPromotions,
    getABTests,
    emitABTestUpdates

};