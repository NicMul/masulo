const dotenv = require('dotenv');
const Replicate = require('replicate');
const { createCdnConfiguration, findCdnConfigurationByUserId, uploadToBunnyStorage } = require('./bunny-cdn');
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

async function generateAbTestAsset({ variant, imageUrl, imagePrompt, videoPrompt, userId, accountId, gameId, generateImage, generateVideo }) {
  console.log('🎨 Generating AB test asset...');
  console.log('📋 Parameters:', { variant, imageUrl, imagePrompt, videoPrompt, userId, accountId, gameId, generateImage, generateVideo });
  
  // Validate required parameters
  if (!variant || (variant !== 'variantA' && variant !== 'variantB')) {
    throw new Error('variant is required and must be either "variantA" or "variantB"');
  }
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
    
    // Build prompts (identical to promo asset)
    const baseImagePrompt = "Do not change or remove or fade any text. Do not remove any logos. Generate a variation of this image. do not change any text Do not change or remove any text. ";
    const baseVideoPrompt = "Do not change or remove or fade any text. Do not remove any logos. Create a beautiful animation that enhances the appeal. The elements in the picture are cinematic and animate professionally. Make the background eye catching. Keep the main charachter in the scene.";
    
    let finalImagePrompt = baseImagePrompt;
    let finalVideoPrompt = baseVideoPrompt;

    // Append custom prompts if provided
    if (imagePrompt && imagePrompt.trim()) {
      finalImagePrompt += ` ${imagePrompt.trim()}`;
    }
    if (videoPrompt && videoPrompt.trim()) {
      finalVideoPrompt += ` ${videoPrompt.trim()}`;
    }
    
    console.log('  📝 Final Image prompt:', finalImagePrompt);
    console.log('  📝 Final Video prompt:', finalVideoPrompt);
    
    let abTestImageUrl = null;
    let abTestVideoUrl = null;
    let generatedImagePath = null;
    let generatedImageDataURI = null;
    
    // Flow A: Only generateImage=true - Generate BOTH image and video (using AI image for video)
    if (generateImage && !generateVideo) {
      console.log(`  🎯 Processing AB test asset (${variant}) - generating image and video (image as input for video)`);
      
      // Generate AI image using Nano Banana with imageUrl as seed
      generatedImagePath = await generateAIImage(dataURI, finalImagePrompt, replicate);
      
      // Convert generated image to data URI for video generation
      generatedImageDataURI = convertImageToDataURI(generatedImagePath);
      
      // Generate video from the AI-generated image using wan-video
      const videoPath = await generateAIVideo(generatedImageDataURI, finalVideoPrompt, replicate);
      
      // Optimize video for web
      const optimizedPath = await optimizeVideoForWeb(videoPath);
      
      // Upload both image and video to CDN 'ab' folder
      const randomString = generateRandomString(9);
      const abTestImageFilename = `${variant}-${randomString}.jpg`;
      const abTestVideoFilename = `${variant}-${randomString}.mp4`;
      
      abTestImageUrl = await uploadToBunnyStorage(generatedImagePath, cdnConfig, 'ab', abTestImageFilename);
      abTestVideoUrl = await uploadToBunnyStorage(optimizedPath, cdnConfig, 'ab', abTestVideoFilename);
      
      // NO MongoDB persistence for AB test assets
      
      // Cleanup video files
      cleanupTempFile(videoPath);
      cleanupTempFile(optimizedPath);
    }
    
    // Flow B: Only generateVideo=true
    else if (generateVideo && !generateImage) {
      console.log(`  🎯 Processing AB test asset (${variant}) - generating video only`);
      
      // Generate video directly from imageUrl using wan-video (no image generation)
      const videoPath = await generateAIVideo(dataURI, finalVideoPrompt, replicate);
      
      // Optimize video for web
      const optimizedPath = await optimizeVideoForWeb(videoPath);
      
      // Upload video to CDN 'ab' folder
      const randomString = generateRandomString(9);
      const abTestVideoFilename = `${variant}-${randomString}.mp4`;
      
      abTestVideoUrl = await uploadToBunnyStorage(optimizedPath, cdnConfig, 'ab', abTestVideoFilename);
      
      // NO MongoDB persistence for AB test assets
      
      // Cleanup video files
      cleanupTempFile(videoPath);
      cleanupTempFile(optimizedPath);
    }
    
    // Flow C: Both generateImage=true and generateVideo=true
    else if (generateImage && generateVideo) {
      console.log(`  🎯 Processing AB test asset (${variant}) - generating both image and video`);
      
      // Generate AI image using Nano Banana with imageUrl as seed
      generatedImagePath = await generateAIImage(dataURI, finalImagePrompt, replicate);
      
      // Convert generated image to data URI
      generatedImageDataURI = convertImageToDataURI(generatedImagePath);
      
      // Generate video from the AI-generated image using wan-video
      const videoPath = await generateAIVideo(generatedImageDataURI, finalVideoPrompt, replicate);
      
      // Optimize video for web
      const optimizedPath = await optimizeVideoForWeb(videoPath);
      
      // Upload both image and video to CDN 'ab' folder
      const randomString = generateRandomString(9);
      const abTestImageFilename = `${variant}-${randomString}.jpg`;
      const abTestVideoFilename = `${variant}-${randomString}.mp4`;
      
      abTestImageUrl = await uploadToBunnyStorage(generatedImagePath, cdnConfig, 'ab', abTestImageFilename);
      abTestVideoUrl = await uploadToBunnyStorage(optimizedPath, cdnConfig, 'ab', abTestVideoFilename);
      
      // NO MongoDB persistence for AB test assets
      
      // Cleanup video files
      cleanupTempFile(videoPath);
      cleanupTempFile(optimizedPath);
    }
    
    // Cleanup temporary files
    cleanupTempFile(imagePath);
    if (generatedImagePath) {
      cleanupTempFile(generatedImagePath);
    }
    
    // Return specific payload format for AB test assets
    return {
      assetType: 'ab-test',
      variant: variant,
      imageUrl: abTestImageUrl,
      videoUrl: abTestVideoUrl
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
  generateAbTestAsset
};

