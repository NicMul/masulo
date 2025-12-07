const { logError } = require('../utils/logger');
const dotenv = require('dotenv');

const env = dotenv.config();


function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = env.parsed.AI_AGENT_API_KEY;

  if (!expectedApiKey) {
    logError('AI_AGENT_API_KEY not configured in environment');
    return res.status(500).send({ 
      error: 'Server configuration error',
      message: 'API key authentication not configured'
    });
  }

  if (!apiKey) {
    logError('API key missing from request');
    return res.status(401).send({ 
      error: 'Unauthorized',
      message: 'API key required. Please provide X-API-Key header.'
    });
  }

  if (apiKey !== expectedApiKey) {
    logError('Invalid API key provided');
    return res.status(403).send({ 
      error: 'Forbidden',
      message: 'Invalid API key'
    });
  }

  next();
}

module.exports = {
  apiKeyAuth
};

