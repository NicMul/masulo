const joi = require('joi');
const utility = require('../helper/utility');
const socketService = require('../realtime/socket');
const Game = require('../model/game');
const { v4: uuidv4 } = require('uuid');

exports.handle = async function(req, res){
  // Check if SDK sockets exist for this user
  const io = socketService.getIO();
  const userRoom = `user:${req.user}`;
  const socketsInRoom = io.sockets.adapter.rooms.get(userRoom);
  
  if (!socketsInRoom || socketsInRoom.size === 0) {
    return res.status(400).send({
      success: false,
      message: 'No active SDK connection found. Please ensure the website where the SDK is installed is currently open.'
    });
  }

  // generate completely unique sessionId for the scrape request
  const sessionId = uuidv4();

  // Create Promise to wait for scrape response from SDK
  const scrapePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socketService.scrapeEventEmitter.removeAllListeners(`response-${sessionId}`);
      resolve(null); // Resolve with null on timeout
    }, 15000); // 15 seconds wait

    socketService.scrapeEventEmitter.once(`response-${sessionId}`, (games) => {
      clearTimeout(timeout);
      resolve(games);
    });
  });

  // Emit scrape request to user's SDK
  io.to(userRoom).emit('scrape-request', { sessionId });

  // Wait for response
  const scrapedGames = await scrapePromise;

  if (!scrapedGames) {
    return res.status(408).send({
      success: false,
      message: 'Scrape request timed out. No response received from SDK.'
    });
  }

  // Extract IDs to query Database
  const scrapedGameIds = scrapedGames.map(game => game.id).filter(id => !!id);
  let newGames = [];

  if (scrapedGameIds.length > 0) {
    // Find existing games
    const existingGamesData = await Game.getByIds(scrapedGameIds);
    const existingGameIds = new Set(existingGamesData.map(g => g.id));
    
    // Filter out games that exist in the DB
    newGames = scrapedGames.filter(game => game.id && !existingGameIds.has(game.id));
  }
  
  // log the payload to console
  console.log('Scraper endpoint finished. Found total:', scrapedGames.length, 'New games:', newGames.length);

  // return the payload with status
  res.status(200).send({ 
    success: true,
    message: 'Scrape completed successfully.',
    games: newGames 
  });
}
