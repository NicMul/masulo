const dotenv = require('dotenv');
const { 
  findCdnConfigurationByUserId, 
  createCdnConfiguration, 
  uploadToBunnyStorage 
} = require('./storage');
const { getReplicateClient, generateImage: generateAIImage, generateVideo: generateAIVideo, updateDatabase } = require('./mediaTools');
const { enrichPromptWithContext } = require('./promptEnrichment');
const {
  generateRandomString,
  downloadImageToTemp,
  convertImageToDataURI,
  optimizeVideoForWeb,
  cleanupTempFile
} = require('../utils/assetUtils');
const { logStep, logPrompt, logError, logSuccess } = require('../utils/logger');

// Load environment variables
dotenv.config();

/**
 * Main media pipeline function matching server/services/generate-current-asset.js
 */
async function processMediaPipeline({ 
  imageUrl, 
  imagePrompt = '', 
  videoPrompt = '', 
  theme = 'default', 
  assetType = 'current', 
  userId = null, 
  accountId = null, 
  gameId = null, 
  generateImage = null, 
  generateVideo = null 
}) {
  logStep('🎨', 'Starting media pipeline...');
  logStep('📋', 'Parameters received', { 
    imageUrl, 
    imagePrompt: imagePrompt || '(empty)', 
    videoPrompt: videoPrompt || '(empty)', 
    theme, 
    assetType, 
    userId, 
    accountId, 
    gameId, 
    generateImage, 
    generateVideo 
  });
  
  // Step 1: Validate required parameters
  logStep('✅', 'Step 1: Validating parameters...');
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
  if ((!generateImage || generateImage === null || generateImage === false) && 
      (!generateVideo || generateVideo === null || generateVideo === false)) {
    throw new Error('generateImage or generateVideo are required and cannot be empty');
  }
  logSuccess('Parameters validated');
  
  // Step 2: Get or create CDN configuration
  logStep('🔧', 'Step 2: Getting CDN configuration...');
  let cdnConfig = null;
  try {
    cdnConfig = await findCdnConfigurationByUserId(userId, accountId);
    if (!cdnConfig) {
      logStep('📦', 'Creating new CDN configuration...');
      cdnConfig = await createCdnConfiguration(userId, accountId);
    }
    logSuccess('CDN Configuration ready', {
      storageZoneName: cdnConfig.storageZoneName,
      cdnUrl: cdnConfig.cdnUrl
    });
  } catch (error) {
    logError('CDN Configuration Error', error);
    throw error;
  }

  // Step 3: Initialize Replicate client
  logStep('🔧', 'Step 3: Initializing Replicate client...');
  const replicate = getReplicateClient();

  try {
    // Step 4: Download original image
    logStep('📥', 'Step 4: Downloading original image...');
    const imagePath = await downloadImageToTemp(imageUrl);
    
    // Step 5: Convert to data URI
    logStep('🔄', 'Step 5: Converting image to data URI...');
    const dataURI = convertImageToDataURI(imagePath);
    
    // Step 6: Build prompts
    logStep('📝', 'Step 6: Building prompts...');
    const baseImagePrompt = "This is an online casino game thumbnail. Create a beautiful enhanced version that improves the visual appeal. The elements should be cinematic and professional. Where possible, use the game's theme color for enhancement. the main items of the image should be enhanced and not changed. Do not change or remove any text. ";
    const baseVideoPrompt = "This is an online casino game thumbnail. Create a beautiful animation that enhances the appeal. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop. Do not change or remove any text.";
    
    logPrompt('BUILD', 'Base Image Prompt', baseImagePrompt);
    logPrompt('BUILD', 'Base Video Prompt', baseVideoPrompt);
    
    if (imagePrompt && imagePrompt.trim()) {
      logPrompt('USER INPUT', 'User Image Prompt', imagePrompt.trim());
    }
    if (videoPrompt && videoPrompt.trim()) {
      logPrompt('USER INPUT', 'User Video Prompt', videoPrompt.trim());
    }
    
    let finalImagePrompt = baseImagePrompt;
    let finalVideoPrompt = baseVideoPrompt;
    
    // Enrich prompts with OpenAI (enabled by default, set ENABLE_PROMPT_ENRICHMENT=false to disable)
    // User prompts are included in the enrichment process, not just appended
    if (process.env.ENABLE_PROMPT_ENRICHMENT !== 'false') {
      logStep('🤖', 'Enriching prompts with OpenAI (including user prompts in enrichment)...');
      try {
        finalImagePrompt = await enrichPromptWithContext(
          baseImagePrompt, 
          imagePrompt || '', 
          { imageUrl, assetType, theme }
        );
        finalVideoPrompt = await enrichPromptWithContext(
          baseVideoPrompt, 
          videoPrompt || '', 
          { imageUrl, assetType, theme }
        );
        logPrompt('ENRICHED', 'Final Image Prompt (After Enrichment)', finalImagePrompt);
        logPrompt('ENRICHED', 'Final Video Prompt (After Enrichment)', finalVideoPrompt);
      } catch (error) {
        logError('Prompt enrichment failed, falling back to base + appended prompts', error);
        // Fallback: append user prompts if enrichment fails
        if (imagePrompt && imagePrompt.trim()) {
          finalImagePrompt = `${baseImagePrompt} ${imagePrompt.trim()}`;
        }
        if (videoPrompt && videoPrompt.trim()) {
          finalVideoPrompt = `${baseVideoPrompt} ${videoPrompt.trim()}`;
        }
      }
    } else {
      logStep('ℹ️', 'Prompt enrichment disabled (ENABLE_PROMPT_ENRICHMENT=false), appending user prompts...');
      // If enrichment is disabled, append user prompts
      if (imagePrompt && imagePrompt.trim()) {
        finalImagePrompt += ` ${imagePrompt.trim()}`;
        logPrompt('APPEND', 'Custom Image Prompt Added', imagePrompt.trim());
      }
      if (videoPrompt && videoPrompt.trim()) {
        finalVideoPrompt += ` ${videoPrompt.trim()}`;
        logPrompt('APPEND', 'Custom Video Prompt Added', videoPrompt.trim());
      }
    }
    
    logPrompt('FINAL', 'Final Image Prompt', finalImagePrompt);
    logPrompt('FINAL', 'Final Video Prompt', finalVideoPrompt);
    
    let testImageUrl = null;
    let testVideoUrl = null;
    let generatedImagePath = null;
    let generatedImageDataURI = null;
    
    // Flow A: Only generateImage=true - Generate BOTH image and video (using AI image for video)
    if (generateImage && !generateVideo) {
      logStep('🎯', 'Flow A: Generating image and video (image as input for video)');
      
      // Step 7: Generate AI image using Nano Banana
      logStep('🎨', 'Step 7: Generating AI image...');
      generatedImagePath = await generateAIImage(dataURI, finalImagePrompt, replicate);
      
      // Convert generated image to data URI for video generation
      logStep('🔄', 'Converting generated image to data URI...');
      generatedImageDataURI = convertImageToDataURI(generatedImagePath);
      
      // Step 8: Generate video from the AI-generated image
      logStep('🎥', 'Step 8: Generating video from AI image...');
      const videoPath = await generateAIVideo(generatedImageDataURI, finalVideoPrompt, replicate);
      
      // Step 9: Optimize video for web
      logStep('🔧', 'Step 9: Optimizing video for web...');
      const optimizedPath = await optimizeVideoForWeb(videoPath);
      
      // Step 10: Upload both image and video to CDN test folder
      logStep('📤', 'Step 10: Uploading to BunnyCDN...');
      const randomString = generateRandomString(9);
      const testImageFilename = `test-current-${randomString}.jpg`;
      const testVideoFilename = `test-current-${randomString}.mp4`;
      
      testImageUrl = await uploadToBunnyStorage(generatedImagePath, cdnConfig, 'test', testImageFilename);
      testVideoUrl = await uploadToBunnyStorage(optimizedPath, cdnConfig, 'test', testVideoFilename);
      
      // Step 11: Update MongoDB game collection
      logStep('💾', 'Step 11: Updating database...');
      if (gameId && (testImageUrl || testVideoUrl)) {
        try {
          const updateData = {};
          if (testImageUrl) updateData.testImage = testImageUrl;
          if (testVideoUrl) updateData.testVideo = testVideoUrl;
          
          await updateDatabase(gameId, userId, updateData);
          logSuccess('Database updated successfully');
        } catch (error) {
          logError('Failed to update database', error);
          // Don't throw here - we still want to return the result
        }
      }
      
      // Step 12: Cleanup video files
      logStep('🗑️', 'Step 12: Cleaning up temporary files...');
      cleanupTempFile(videoPath);
      cleanupTempFile(optimizedPath);
    }
    
    // Flow B: Only generateVideo=true
    else if (generateVideo && !generateImage) {
      logStep('🎯', 'Flow B: Generating video only');
      
      // Step 7: Generate video directly from imageUrl
      logStep('🎥', 'Step 7: Generating video from original image...');
      const videoPath = await generateAIVideo(dataURI, finalVideoPrompt, replicate);
      
      // Step 8: Optimize video for web
      logStep('🔧', 'Step 8: Optimizing video for web...');
      const optimizedPath = await optimizeVideoForWeb(videoPath);
      
      // Step 9: Upload video to CDN test folder
      logStep('📤', 'Step 9: Uploading to BunnyCDN...');
      const randomString = generateRandomString(9);
      const testVideoFilename = `test-current-${randomString}.mp4`;
      
      testVideoUrl = await uploadToBunnyStorage(optimizedPath, cdnConfig, 'test', testVideoFilename);
      
      // Step 10: Update MongoDB game collection
      logStep('💾', 'Step 10: Updating database...');
      if (gameId && testVideoUrl) {
        try {
          await updateDatabase(gameId, userId, { 
            testVideo: testVideoUrl
          });
          logSuccess('Database updated successfully');
        } catch (error) {
          logError('Failed to update database', error);
          // Don't throw here - we still want to return the result
        }
      }
      
      // Step 11: Cleanup video files
      logStep('🗑️', 'Step 11: Cleaning up temporary files...');
      cleanupTempFile(videoPath);
      cleanupTempFile(optimizedPath);
    }
    
    // Flow C: Both generateImage=true and generateVideo=true
    else if (generateImage && generateVideo) {
      logStep('🎯', 'Flow C: Generating both image and video');
      
      // Step 7: Generate AI image using Nano Banana
      logStep('🎨', 'Step 7: Generating AI image...');
      generatedImagePath = await generateAIImage(dataURI, finalImagePrompt, replicate);
      
      // Convert generated image to data URI
      logStep('🔄', 'Converting generated image to data URI...');
      generatedImageDataURI = convertImageToDataURI(generatedImagePath);
      
      // Step 8: Generate video from the AI-generated image
      logStep('🎥', 'Step 8: Generating video from AI image...');
      const videoPath = await generateAIVideo(generatedImageDataURI, finalVideoPrompt, replicate);
      
      // Step 9: Optimize video for web
      logStep('🔧', 'Step 9: Optimizing video for web...');
      const optimizedPath = await optimizeVideoForWeb(videoPath);
      
      // Step 10: Upload both image and video to CDN test folder
      logStep('📤', 'Step 10: Uploading to BunnyCDN...');
      const randomString = generateRandomString(9);
      const testImageFilename = `test-current-${randomString}.jpg`;
      const testVideoFilename = `test-current-${randomString}.mp4`;
      
      testImageUrl = await uploadToBunnyStorage(generatedImagePath, cdnConfig, 'test', testImageFilename);
      testVideoUrl = await uploadToBunnyStorage(optimizedPath, cdnConfig, 'test', testVideoFilename);
      
      // Step 11: Update MongoDB game collection
      logStep('💾', 'Step 11: Updating database...');
      if (gameId && (testImageUrl || testVideoUrl)) {
        try {
          const updateData = {};
          if (testImageUrl) updateData.testImage = testImageUrl;
          if (testVideoUrl) updateData.testVideo = testVideoUrl;
          
          await updateDatabase(gameId, userId, updateData);
          logSuccess('Database updated successfully');
        } catch (error) {
          logError('Failed to update database', error);
          // Don't throw here - we still want to return the result
        }
      }
      
      // Step 12: Cleanup video files
      logStep('🗑️', 'Step 12: Cleaning up temporary files...');
      cleanupTempFile(videoPath);
      cleanupTempFile(optimizedPath);
    }
    
    // Step 13: Cleanup temporary files
    logStep('🗑️', 'Step 13: Final cleanup...');
    cleanupTempFile(imagePath);
    if (generatedImagePath) {
      cleanupTempFile(generatedImagePath);
    }
    
    // Return specific payload format matching server pattern
    const result = {
      assetType: assetType || 'current',
      imageUrl: testImageUrl,
      videoUrl: testVideoUrl
    };
    
    logSuccess('Media pipeline completed successfully', result);
    return result;
    
  } catch (error) {
    logError('Generation failed', error);

    // Handle specific error types matching server pattern
    if (error instanceof Error) {
      // Handle Replicate service unavailability
      if (error.message.includes('Service is temporarily unavailable') || 
          error.message.includes('E004') ||
          error.message.includes('temporarily unavailable')) {
        logError('Replicate service temporarily unavailable', null);
        throw new Error('AI service is temporarily unavailable. Please try again in a few minutes.');
      }
      
      // Handle rate limiting
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        logError('Rate limit hit', null);
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      // Handle other Replicate errors
      if (error.message.includes('Prediction failed')) {
        logError('Replicate prediction failed', null);
        throw new Error('AI generation failed. Please try again with a different image or prompt.');
      }
    }

    throw error;
  }
}

module.exports = {
  processMediaPipeline
};

