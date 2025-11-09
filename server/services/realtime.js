const game = require('../model/game');
const promotion = require('../model/promotion');
const abtest = require('../model/abtest');

const getGamesById = async (gameIds, userId, socket) => {
    try {
        const games = await game.getByIds(gameIds);
        
        socket.emit('games-response', {
            success: true,
            games: games,
            count: games.length,
            timestamp: new Date().toISOString()
        });
        
        return games;
    } catch (error) {
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
      const promotions = await promotion.get({ user: userId });
      
      const publishedPromotions = promotions.filter(promo => promo.published === true);
      
      socket.emit('promotions-response', {
        promotions: publishedPromotions,
        success: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('promotions-response', {
        promotions: [],
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

const emitGameUpdates = async (gameIds, userId, emitGameUpdateFn) => {
    try {
        const games = await game.getByIds(gameIds);
        
        if (emitGameUpdateFn) {
            emitGameUpdateFn(gameIds, games);
        }
        
        return games;
    } catch (error) {
        return [];
    }
}

const emitPromotionUpdates = async (userId, emitPromotionUpdateFn) => {
    try {
        const allPromotions = await promotion.get({ user: userId });
        
        const publishedPromotions = allPromotions.filter(promo => promo.published === true);
        
        if (emitPromotionUpdateFn) {
            emitPromotionUpdateFn(userId, publishedPromotions, allPromotions);
        }
        
        return publishedPromotions;
    } catch (error) {
        return [];
    }
}

const getABTests = async (userId, socket, io) => {
    try {
      const abtests = await abtest.get({ user: userId });
      
      const publishedABTests = abtests.filter(test => test.published === true);
      
      const abtestsWithRoomCount = publishedABTests.map(test => {
        const testObj = test.toObject ? test.toObject() : test;
        
        if (io) {
          const roomName = `game:${test.gameId}`;
          const roomCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
          return {
            ...testObj,
            roomCount: roomCount
          };
        }
        return testObj;
      });
      
      socket.emit('abtests-response', {
        abtests: abtestsWithRoomCount,
        success: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('abtests-response', {
        abtests: [],
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

const emitABTestUpdates = async (userId, emitABTestUpdateFn) => {
    try {
        const allABTests = await abtest.get({ user: userId });
        
        const publishedABTests = allABTests.filter(test => test.published === true);
        
        if (emitABTestUpdateFn) {
            emitABTestUpdateFn(userId, publishedABTests, allABTests);
        }
        
        return publishedABTests;
    } catch (error) {
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