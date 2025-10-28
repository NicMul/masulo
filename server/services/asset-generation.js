const { generateOriginalAsset } = require('./generate-original-asset');
const { generateCurrentAsset } = require('./generate-current-asset');
const { generateThemeAsset } = require('./generate-theme-asset');



async function generateImageAndVideoWithPrompt(imageUrl, imagePrompt = '', videoPrompt = '', theme = 'default', assetType = 'original', userId = null, accountId = null, gameId = null, generateImage = null, generateVideo = null) {

    console.log('🎨 Generating AI image and video...');
    console.log('📋 Parameters:', { imageUrl, imagePrompt, videoPrompt, theme, assetType, userId, accountId, gameId });
    
    // Validate required parameters
    if (!imageUrl || imageUrl.trim() === '') {
        throw new Error('imageUrl is required and cannot be empty');
    }
    if (!userId || userId.trim() === '') {
        throw new Error('userId is required and cannot be empty');
    }
    if (!accountId || accountId.trim() === '') {
        throw new Error('accountId is required and cannot be empty');
    }
    if (!gameId || gameId.trim() === '') {
        throw new Error('gameId is required and cannot be empty');
    }
    if ((!generateImage || generateImage === null || generateImage === false) && (!generateVideo || generateVideo === null || generateVideo === false)) {
        throw new Error('generateImage or generateVideo are required and cannot be empty');
    }
    
    // Route to appropriate asset generator based on assetType
    if (assetType === 'original') {
      return await generateOriginalAsset({
        imageUrl,
        imagePrompt,
        videoPrompt,
        userId,
        accountId,
        gameId
      });
    } else if (assetType === 'current') {
      return await generateCurrentAsset({
        imageUrl,
        imagePrompt,
        videoPrompt,
        userId,
        accountId,
        gameId,
        generateImage,
        generateVideo
      });
    } else if (assetType === 'theme') {
      return await generateThemeAsset({
        imageUrl,
        imagePrompt,
        videoPrompt,
        userId,
        accountId,
        gameId,
        generateImage,
        generateVideo
      });
    } else {
      // TODO: Implement theme asset generator
      throw new Error(`Asset type '${assetType}' not yet implemented`);
    }
}
  
  module.exports = {
    generateImageAndVideoWithPrompt
  };