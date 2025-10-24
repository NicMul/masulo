const dotenv = require('dotenv');
const Replicate = require('replicate');
const { createCdnConfiguration, findCdnConfigurationByUserId, uploadToBunnyStorage } = require('./bunny-cdn');
const game = require('../model/mongo/game');
const {
  generateRandomString,
  downloadImageToTemp,
  convertImageToDataURI,
  generateAIImage,
  generateAIVideo,
  optimizeVideoForWeb,
  cleanupTempFile
} = require('./asset-generation-utils');

// Load environment variables
dotenv.config();

async function generateCurrentAsset({ imageUrl, prompt, userId, accountId, gameId, generateImage, generateVideo }) {
  console.log('🎨 Generating current asset...');
  console.log('📋 Parameters:', { imageUrl, prompt, userId, accountId, gameId, generateImage, generateVideo });
  
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

  try {
    // Download original image
    const imagePath = await downloadImageToTemp(imageUrl);
    
    // Convert to data URI
    const dataURI = convertImageToDataURI(imagePath);
    
    // Build prompts
    const baseImagePrompt = "This is an online casino game thumbnail. Create a beautiful enhanced version that improves the visual appeal. The elements should be cinematic and professional. Where possible, use the game's theme color for enhancement. the main items of the image should be enhanced and not changed. Do not change or remove any text. ";
    const baseVideoPrompt = "This is an online casino game thumbnail. Create a beautiful animation that enhances the appeal. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop. Do not change or remove any text.";
    
    let finalImagePrompt = baseImagePrompt;
    let finalVideoPrompt = baseVideoPrompt;

    // Append custom prompt if provided
    if (prompt && prompt.trim()) {
      finalImagePrompt += ` ${prompt.trim()}`;
      finalVideoPrompt += ` ${prompt.trim()}`;
    }
    
    console.log('  📝 Image prompt:', finalImagePrompt);
    console.log('  📝 Video prompt:', finalVideoPrompt);
    
    let testImageUrl = null;
    let testVideoUrl = null;
    let generatedImagePath = null;
    let generatedImageDataURI = null;
    
    // Flow A: Only generateImage=true - Generate BOTH image and video (using AI image for video)
    if (generateImage && !generateVideo) {
      console.log('  🎯 Processing current asset - generating image and video (image as input for video)');
      
      // Generate AI image using Nano Banana with imageUrl as seed
      generatedImagePath = await generateAIImage(dataURI, finalImagePrompt, replicate);
      
      // Convert generated image to data URI for video generation
      generatedImageDataURI = convertImageToDataURI(generatedImagePath);
      
      // Generate video from the AI-generated image using wan-video
      const videoPath = await generateAIVideo(generatedImageDataURI, finalVideoPrompt, replicate);
      
      // Optimize video for web
      const optimizedPath = await optimizeVideoForWeb(videoPath);
      
      // Upload both image and video to CDN test folder
      const randomString = generateRandomString(9);
      const testImageFilename = `test-current-${randomString}.jpg`;
      const testVideoFilename = `test-current-${randomString}.mp4`;
      
      testImageUrl = await uploadToBunnyStorage(generatedImagePath, cdnConfig, 'test', testImageFilename);
      testVideoUrl = await uploadToBunnyStorage(optimizedPath, cdnConfig, 'test', testVideoFilename);
      
      // Update MongoDB game collection for both test image and video
      if (gameId && (testImageUrl || testVideoUrl)) {
        try {
          console.log('📝 Updating game testImage and testVideo fields in MongoDB...');
          const updateData = {};
          if (testImageUrl) updateData.testImage = testImageUrl;
          if (testVideoUrl) updateData.testVideo = testVideoUrl;
          
          await game.update({ 
            id: gameId, 
            user: userId, 
            data: updateData
          });
          console.log('✅ Successfully updated game testImage and testVideo fields');
        } catch (error) {
          console.error('❌ Failed to update game testImage and testVideo fields:', error.message);
          // Don't throw here - we still want to return the result
        }
      }
      
      // Cleanup video files
      cleanupTempFile(videoPath);
      cleanupTempFile(optimizedPath);
    }
    
    // Flow B: Only generateVideo=true
    else if (generateVideo && !generateImage) {
      console.log('  🎯 Processing current asset - generating video only');
      
      // Generate video directly from imageUrl using wan-video (no image generation)
      const videoPath = await generateAIVideo(dataURI, finalVideoPrompt, replicate);
      
      // Optimize video for web
      const optimizedPath = await optimizeVideoForWeb(videoPath);
      
      // Upload video to CDN test folder
      const randomString = generateRandomString(9);
      const testVideoFilename = `test-current-${randomString}.mp4`;
      
      testVideoUrl = await uploadToBunnyStorage(optimizedPath, cdnConfig, 'test', testVideoFilename);
      
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
      
      // Cleanup video files
      cleanupTempFile(videoPath);
      cleanupTempFile(optimizedPath);
    }
    
    // Flow C: Both generateImage=true and generateVideo=true
    else if (generateImage && generateVideo) {
      console.log('  🎯 Processing current asset - generating both image and video');
      
      // Generate AI image using Nano Banana with imageUrl as seed
      generatedImagePath = await generateAIImage(dataURI, finalImagePrompt, replicate);
      
      // Convert generated image to data URI
      generatedImageDataURI = convertImageToDataURI(generatedImagePath);
      
      // Generate video from the AI-generated image using wan-video
      const videoPath = await generateAIVideo(generatedImageDataURI, finalVideoPrompt, replicate);
      
      // Optimize video for web
      const optimizedPath = await optimizeVideoForWeb(videoPath);
      
      // Upload both image and video to CDN test folder
      const randomString = generateRandomString(9);
      const testImageFilename = `test-current-${randomString}.jpg`;
      const testVideoFilename = `test-current-${randomString}.mp4`;
      
      testImageUrl = await uploadToBunnyStorage(generatedImagePath, cdnConfig, 'test', testImageFilename);
      testVideoUrl = await uploadToBunnyStorage(optimizedPath, cdnConfig, 'test', testVideoFilename);
      
      // Update MongoDB game collection for both test image and video
      if (gameId && (testImageUrl || testVideoUrl)) {
        try {
          console.log('📝 Updating game testImage and testVideo fields in MongoDB...');
          const updateData = {};
          if (testImageUrl) updateData.testImage = testImageUrl;
          if (testVideoUrl) updateData.testVideo = testVideoUrl;
          
          await game.update({ 
            id: gameId, 
            user: userId, 
            data: updateData
          });
          console.log('✅ Successfully updated game testImage and testVideo fields');
        } catch (error) {
          console.error('❌ Failed to update game testImage and testVideo fields:', error.message);
          // Don't throw here - we still want to return the result
        }
      }
      
      // Cleanup video files
      cleanupTempFile(videoPath);
      cleanupTempFile(optimizedPath);
    }
    
    // Cleanup temporary files
    cleanupTempFile(imagePath);
    if (generatedImagePath) {
      cleanupTempFile(generatedImagePath);
    }
    
    // Return specific payload format for current assets
    return {
      assetType: 'current',
      imageUrl: testImageUrl,
      videoUrl: testVideoUrl
    };
    
  } catch (error) {
    console.error('  ❌ Generation failed:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Handle Replicate service unavailability
      if (error.message.includes('Service is temporarily unavailable') || 
          error.message.includes('E004') ||
          error.message.includes('temporarily unavailable')) {
        console.log('  ⚠️ Replicate service temporarily unavailable');
        throw new Error('AI service is temporarily unavailable. Please try again in a few minutes.');
      }
      
      // Handle rate limiting
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        console.log('  ⏳ Rate limit hit, will retry after delay...');
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      // Handle other Replicate errors
      if (error.message.includes('Prediction failed')) {
        console.log('  ⚠️ Replicate prediction failed');
        throw new Error('AI generation failed. Please try again with a different image or prompt.');
      }
    }

    throw error;
  }
}

module.exports = {
  generateCurrentAsset
};
