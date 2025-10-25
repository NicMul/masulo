const game = require('../model/game');

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

module.exports = {
    getGamesById,
    emitGameUpdates
};