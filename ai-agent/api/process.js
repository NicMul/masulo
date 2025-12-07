const express = require('express');
const joi = require('joi');
const { processMediaPipeline } = require('../services/mediaPipeline');
const { logStep, logError, logSuccess } = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/process
 * Processes media generation tasks with OpenAI agentic orchestration
 */
router.post('/process', async (req, res) => {
  logStep('📥', 'Received request to /api/process');
  logStep('📋', 'Request body', req.body);

  // Validate request body using Joi (following server/controller/aiController.js pattern)
  const schema = joi.object({
    imageUrl: joi.string().required(),
    imagePrompt: joi.string().allow(''),
    videoPrompt: joi.string().allow(''),
    theme: joi.string().allow(''),
    assetType: joi.string().allow(''),
    gameId: joi.string().required(),
    generateImage: joi.boolean().required(),
    generateVideo: joi.boolean().required(),
    userId: joi.string().required(),
    accountId: joi.string().required(),
    variant: joi.string().allow('').optional()
  });

  const { error, value: data } = schema.validate(req.body);

  if (error) {
    logError('Validation error', error);
    return res.status(400).send({ 
      error: 'Validation error',
      message: error.details[0].message 
    });
  }

  logStep('✅', 'Request validated successfully');

  try {
    logStep('🚀', 'Starting media pipeline...');
    const result = await processMediaPipeline({
      imageUrl: data.imageUrl,
      imagePrompt: data.imagePrompt,
      videoPrompt: data.videoPrompt,
      theme: data.theme,
      assetType: data.assetType || 'current',
      userId: data.userId,
      accountId: data.accountId,
      gameId: data.gameId,
      generateImage: data.generateImage,
      generateVideo: data.generateVideo
    });

    logSuccess('Request completed successfully', result);
    return res.status(200).send({ data: result });
  } catch (error) {
    logError('Request failed', error);
    return res.status(500).send({ 
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;

