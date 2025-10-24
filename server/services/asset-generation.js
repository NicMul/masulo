const { generateOriginalAsset } = require('./generate-original-asset');



async function generateImageAndVideoWithPrompt(imageUrl, prompt = '', theme = 'default', assetType = 'original', userId = null, accountId = null, gameId = null, generateImage = null, generateVideo = null) {

    console.log('🎨 Generating AI image and video...');
    console.log('📋 Parameters:', { imageUrl, prompt, theme, assetType, userId, accountId, gameId });
    
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
    
    // Short circuit for non-original assets during testing
    if (assetType !== 'original') {
      console.log('⚠️ Short-circuiting: Only original asset type is allowed during testing');
      throw new Error('Only original asset type is allowed during testing');
    }
    
    // Route to appropriate asset generator based on assetType
    if (assetType === 'original') {
      return await generateOriginalAsset({
        imageUrl,
        prompt,
        userId,
        accountId,
        gameId
      });
    } else {
      // TODO: Implement current and theme asset generators
      throw new Error(`Asset type '${assetType}' not yet implemented`);
    }
}
  
  module.exports = {
    generateImageAndVideoWithPrompt
  };