const dotenv = require('dotenv');
const Replicate = require('replicate');
const { createCdnConfiguration, findCdnConfigurationByUserId, uploadToBunnyStorage } = require('./bunny-cdn');
const game = require('../model/mongo/game');
const {
  generateRandomString,
  downloadImageToTemp,
  convertImageToDataURI,
  generateAIVideo,
  optimizeVideoForWeb,
  cleanupTempFile
} = require('./asset-generation-utils');

// Load environment variables
dotenv.config();

async function generateOriginalAsset({ imageUrl, prompt, userId, accountId, gameId }) {
  console.log('🎨 Generating original asset...');
  console.log('📋 Parameters:', { imageUrl, prompt, userId, accountId, gameId });
  
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
  
  // Get or create CDN configuration
  let cdnConfig = null;
  try {
    console.log('🔧 Getting CDN configuration...');
    cdnConfig = await findCdnConfigurationByUserId(userId, accountId);
    if (!cdnConfig) {
      console.log('📦 Creating new CDN configuration...');
      cdnConfig = await createCdnConfiguration(userId, accountId);
    }
    console.log('✅ CDN Configuration ready:', {
      storageZoneName: cdnConfig.storageZoneName,
      cdnUrl: cdnConfig.cdnUrl
    });
  } catch (error) {
    console.error('❌ CDN Configuration Error:', error.message);
    throw error;
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  console.log('  🎯 Processing original asset - skipping AI image generation');
  
  try {
    // Download original image
    const imagePath = await downloadImageToTemp(imageUrl);
    
    // Convert to data URI
    const dataURI = convertImageToDataURI(imagePath);
    
    // Build video generation prompt
    const baseVideoPrompt = "This is an online casino game thumbnail. Create a beautiful animation that enhances the appeal. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop.";
    let finalVideoPrompt = baseVideoPrompt;

    // Append custom prompt if provided
    if (prompt && prompt.trim()) {
      finalVideoPrompt += ` ${prompt.trim()}`;
    }
    
    console.log('  📝 Video prompt:', finalVideoPrompt);
    
    // Generate video directly from original image
    const videoPath = await generateAIVideo(dataURI, finalVideoPrompt, replicate);
    
    // Optimize video for web
    const optimizedPath = await optimizeVideoForWeb(videoPath);
    
    // Upload only video to CDN test folder
    const randomString = generateRandomString(9);
    const testVideoFilename = `test-default-${randomString}.mp4`;
    
    const testVideoUrl = await uploadToBunnyStorage(optimizedPath, cdnConfig, 'test', testVideoFilename);
    
    // Update MongoDB game collection for test video only
    if (gameId && testVideoUrl) {
      try {
        console.log('📝 Updating game testVideo field in MongoDB...');
        await game.update({ 
          id: gameId, 
          user: userId, 
          data: { 
            testVideo: testVideoUrl
          } 
        });
        console.log('✅ Successfully updated game testVideo field');
      } catch (error) {
        console.error('❌ Failed to update game testVideo field:', error.message);
        // Don't throw here - we still want to return the result
      }
    }
    
    // Cleanup temporary files
    cleanupTempFile(imagePath);
    cleanupTempFile(optimizedPath);
    
    // Return specific payload format for original assets
    return {
      assetType: 'original',
      imageUrl: null,  // original only generates video
      videoUrl: testVideoUrl
    };
    
  } catch (error) {
    console.error('  ❌ Generation failed:', error);

    // Handle rate limiting specifically
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('rate limit'))) {
      console.log('  ⏳ Rate limit hit, will retry after delay...');
      throw new Error('Rate limit exceeded - will retry');
    }

    throw error;
  }
}

module.exports = {
  generateOriginalAsset
};
