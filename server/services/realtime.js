const game = require('../model/game');
const promotion = require('../model/promotion');

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
      
      // Emit response back to client
      socket.emit('promotions-response', {
        promotions: promotions,
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
        // Fetch all promotions for the user
        const promotions = await promotion.get({ user: userId });
        
        console.log('Found promotions for update:', promotions?.length || 0);
        
        // Emit updates to user-specific room
        if (emitPromotionUpdateFn) {
            emitPromotionUpdateFn(userId, promotions);
        }
        
        return promotions;
    } catch (error) {
        console.error('Error emitting promotion updates:', error);
        return [];
    }
}

module.exports = {
    getGamesById,
    emitGameUpdates,
    emitPromotionUpdates,
    getPromotions

};