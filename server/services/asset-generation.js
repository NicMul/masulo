const axios = require('axios');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Replicate = require('replicate');
const { promisify } = require('util');
const { createCdnConfiguration, findCdnConfigurationByUserId, uploadToBunnyStorage } = require('./bunny-cdn');
const game = require('../model/mongo/game');

// Load environment variables
dotenv.config();

const execPromise = promisify(exec);

// Helper function to generate random alphanumeric string
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to download image to temp directory
async function downloadImageToTemp(imageUrl) {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const imageFileName = `image-${Date.now()}.jpg`;
  const imagePath = path.join(tempDir, imageFileName);

  console.log('  📥 Downloading image...');
  const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
  const writer = fs.createWriteStream(imagePath);
  imageResponse.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', () => resolve());
    writer.on('error', reject);
  });

  console.log('  📥 Image downloaded to:', imagePath);
  return imagePath;
}

// Helper function to convert image to data URI
function convertImageToDataURI(imagePath) {
  const imageBase64 = fs.readFileSync(imagePath, 'base64');
  return `data:image/jpeg;base64,${imageBase64}`;
}

// Helper function to build image prompt based on assetType and theme
function buildImagePrompt(assetType, theme, customPrompt) {
  // Base prompts that are always included
  const basePromptDefault = "This is an online casino game thumbnail. Create a high-quality, professional variation that enhances visual appeal while maintaining the core elements and theme of the original image. Keep the composition balanced and eye-catching. Change the background more appealing and make it more eye catching. Do not change any text.";
  
  const basePromptCurrent = "This is an online casino game thumbnail. Create a refined variation that enhances the visual quality, improves lighting and colors, while preserving the original style and key elements. Change the background more appealing and make it more eye catching. Do not change any text.";

  // Theme-specific prompts (for assetType: 'theme')
  const themePrompts = {
    xmas: "Transform this online casino game thumbnail into a festive Christmas theme. Add Santa hats to any characters or faces, incorporate Christmas lights, snowflakes, and festive decorations. Use red, green, and gold colors. Maintain the professional casino game aesthetic while making it festive.",
    christmas: "Transform this online casino game thumbnail into a festive Christmas theme. Add Santa hats to any characters or faces, incorporate Christmas lights, snowflakes, and festive decorations. Use red, green, and gold colors. Maintain the professional casino game aesthetic while making it festive.",
    halloween: "Transform this online casino game thumbnail into a spooky Halloween theme. Add Halloween elements like jack-o'-lanterns, bats, ghosts, spider webs, and eerie lighting. Use orange, purple, and black colors. Maintain the professional casino game aesthetic while making it spooky.",
    valentines: "Transform this online casino game thumbnail into a romantic Valentine's Day theme. Add hearts, roses, romantic lighting, and love-themed decorations. Use pink, red, and white colors. Maintain the professional casino game aesthetic while making it romantic.",
    default: basePromptDefault
  };

  // Build the prompt based on assetType
  let finalImagePrompt = '';
  
  if (assetType === 'theme') {
    // Use theme-specific prompt
    const themeKey = theme.toLowerCase();
    finalImagePrompt = themePrompts[themeKey] || themePrompts.default;
  } else if (assetType === 'current') {
    // Use 'current' variation prompt
    finalImagePrompt = basePromptCurrent;
  } else {
    // Use 'default' variation prompt
    finalImagePrompt = basePromptDefault;
  }

  // Append custom prompt if provided
  if (customPrompt && customPrompt.trim()) {
    finalImagePrompt += ` ${customPrompt.trim()}`;
  }

  console.log('  📝 Image prompt:', finalImagePrompt);
  return finalImagePrompt;
}

// Helper function to generate AI image with Replicate
async function generateAIImage(dataURI, prompt, replicate) {
  console.log('  🎨 Calling nano-banana API...');
  const imageInput = {
    prompt: prompt,
    image_input: [dataURI]
  };

  const imageOutput = await replicate.run("google/nano-banana", { input: imageInput });

  // Save generated image
  const tempDir = path.join(process.cwd(), 'temp');
  const generatedImageFileName = `generated-image-${Date.now()}.jpg`;
  const generatedImagePath = path.join(tempDir, generatedImageFileName);
  await fs.promises.writeFile(generatedImagePath, imageOutput);
  console.log('  ✅ Generated image saved to:', generatedImagePath);
  
  return generatedImagePath;
}

// Helper function to generate AI video with Replicate
async function generateAIVideo(imageDataURI, prompt, replicate) {
  console.log('  🎥 Calling wan-video API...');
  const videoInput = {
    image: imageDataURI,
    prompt: prompt
  };

  const videoOutput = await replicate.run("wan-video/wan-2.2-i2v-fast", { input: videoInput });

  // Save video to temp file
  const tempDir = path.join(process.cwd(), 'temp');
  const videoFileName = `video-${Date.now()}.mp4`;
  const videoPath = path.join(tempDir, videoFileName);
  await fs.promises.writeFile(videoPath, videoOutput);
  console.log('  ✅ Video saved to:', videoPath);
  
  return videoPath;
}

// Helper function to optimize video for web
async function optimizeVideoForWeb(videoPath) {
  console.log('  🔧 Optimizing MP4 for web...');
  const tempDir = path.join(process.cwd(), 'temp');
  const optimizedFileName = `video-optimized-${Date.now()}.mp4`;
  const optimizedPath = path.join(tempDir, optimizedFileName);

  try {
    await execPromise(`ffmpeg -i "${videoPath}" -c:v libx264 -crf 23 -preset fast -pix_fmt yuv420p -movflags +faststart -an "${optimizedPath}"`);
    console.log('  ✅ Video optimized for web');
    
    // Cleanup original video file
    try {
      fs.unlinkSync(videoPath);
    } catch (cleanupError) {
      console.warn('  ⚠️ Failed to cleanup original video:', cleanupError);
    }
    
    return optimizedPath;
  } catch (ffmpegError) {
    console.warn('  ⚠️ FFmpeg optimization failed, using original video:', ffmpegError);
    // If ffmpeg fails, use the original video
    return videoPath;
  }
}

// Helper function to upload assets to storage
async function uploadAssetsToStorage(assetType, cdnConfig, imagePath, videoPath) {
  let result = {};
  
  if (cdnConfig) {
    if (assetType === 'original') {
      // Upload video ONLY to test folder for original type
      const randomString = generateRandomString(9);
      const testVideoFilename = `test-default-${randomString}.mp4`;
      
      const testVideoUrl = await uploadToBunnyStorage(videoPath, cdnConfig, 'test', testVideoFilename);
      
      result.testVideoUrl = testVideoUrl;
    } else if (assetType === 'current' || assetType === 'theme') {
      // Upload both image and video for current/theme types
      const imageFilename = `${generateRandomString(9)}.jpg`;
      const videoFilename = `${generateRandomString(9)}.mp4`;
      
      const imageUrl = await uploadToBunnyStorage(imagePath, cdnConfig, 'images', imageFilename);
      const videoUrl = await uploadToBunnyStorage(videoPath, cdnConfig, 'videos', videoFilename);
      
      result.imageUrl = imageUrl;
      result.videoUrl = videoUrl;
    }
  } else {
    console.log('⚠️ No CDN config - returning local paths');
    result.imagePath = imagePath;
    result.videoPath = videoPath;
  }
  
  return result;
}

// async function generateImageWithReplicate(imageUrl, customPrompt, theme = 'default') {
//   const replicate = new Replicate({
//     auth: process.env.REPLICATE_API_TOKEN,
//   });

//   console.log('  🎨 Generating AI image with nano-banana...');

//   try {
//     // Step 1: Download image to temp file
//     const tempDir = path.join(process.cwd(), 'temp');
//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir, { recursive: true });
//     }

//     const imageFileName = `image-${Date.now()}.jpg`;
//     const imagePath = path.join(tempDir, imageFileName);

//     console.log('  📥 Downloading image...');
//     const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
//     const writer = fs.createWriteStream(imagePath);
//     imageResponse.data.pipe(writer);

//     await new Promise((resolve, reject) => {
//       writer.on('finish', () => resolve());
//       writer.on('error', reject);
//     });

//     console.log('  📥 Image downloaded to:', imagePath);

//     // Step 2: Convert image to base64 data URI
//     const imageBase64 = fs.readFileSync(imagePath, 'base64');
//     const dataURI = `data:image/jpeg;base64,${imageBase64}`;

//     // Step 3: Define prompts based on theme
//     const defaultPrompt = `Generate a variation of this image. do not change any text. ${customPrompt}`;
//     const christmasPrompt = `Generate a new image in the style of Christmas. if there is a face in the image, add a santa hat. Do not change or remove any text. ${customPrompt}`;
//     const halloweenPrompt = `Generate a new image in the style of Halloween. Do not change or remove any text. ${customPrompt}`;
//     const valentinesPrompt = `Generate a new image in the style of Valentines. Do not change or remove any text. ${customPrompt}`;

//     let selectedPrompt = defaultPrompt;

//     switch (theme.toLowerCase()) {
//       case 'christmas':
//         selectedPrompt = christmasPrompt;
//         break;
//       case 'halloween':
//         selectedPrompt = halloweenPrompt;
//         break;
//       case 'valentines':
//         selectedPrompt = valentinesPrompt;
//         break;
//       default:
//         selectedPrompt = defaultPrompt;
//     }

//     const input = {
//       prompt: selectedPrompt,
//       image_input: [dataURI]
//     };

//     console.log('  🎨 Calling nano-banana API for theme:', theme);
//     const output = await replicate.run("google/nano-banana", { input });

//     console.log('  📥 Downloading image from nano-banana...');

//     // Step 4: Save image to temp file
//     const generatedImageFileName = `generated-image-${Date.now()}.jpg`;
//     const generatedImagePath = path.join(tempDir, generatedImageFileName);

//     // Write the file to disk using the proper method
//     await fs.promises.writeFile(generatedImagePath, output);
//     console.log('  ✅ Generated image saved to:', generatedImagePath);

//     // Cleanup original downloaded image file
//     try {
//       fs.unlinkSync(imagePath);
//     } catch (cleanupError) {
//       console.warn('  ⚠️ Failed to cleanup original image:', cleanupError);
//     }

//     return generatedImagePath;

//   } catch (error) {
//     console.error('  ❌ nano-banana generation failed:', error);

//     // Handle rate limiting specifically
//     if (error instanceof Error && (error.message.includes('429') || error.message.includes('rate limit'))) {
//       console.log('  ⏳ Rate limit hit, will retry after delay...');
//       throw new Error('Rate limit exceeded - will retry');
//     }

//     throw error;
//   }
// }

// async function generateVideoWithReplicate(imageUrl, theme = 'default') {
//   const replicate = new Replicate({
//     auth: process.env.REPLICATE_API_TOKEN,
//   });

//   console.log('  🤖 Generating AI animation with Replicate...');

//   try {
//     // Step 1: Download image to temp file
//     const tempDir = path.join(process.cwd(), 'temp');
//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir, { recursive: true });
//     }

//     const imageFileName = `image-${Date.now()}.jpg`;
//     const imagePath = path.join(tempDir, imageFileName);

//     console.log('  📥 Downloading image...');
//     const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
//     const writer = fs.createWriteStream(imagePath);
//     imageResponse.data.pipe(writer);

//     await new Promise((resolve, reject) => {
//       writer.on('finish', () => resolve());
//       writer.on('error', reject);
//     });

//     console.log('  📥 Image downloaded to:', imagePath);

//     // Step 2: Convert image to base64 data URI
//     const imageBase64 = fs.readFileSync(imagePath, 'base64');
//     const dataURI = `data:image/jpeg;base64,${imageBase64}`;

//     const xmasPrompt = "Create a beautiful animation that enhances the appeal. if there is a face in the image, add a santa hat and some christmas lights overlay over the image. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop."
//     const defaultPrompt = "This is an online casino game thumbnail. Create a beautiful animation that enhances the appeal. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop."
//     const halloweenPrompt = "Create a beautiful animation that enhances the appeal in a halloween theme, add a halloween boarder and some halloween lights and some halloween ghosts. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop."
//     const valentinesPrompt = "Create a beautiful animation that enhances the appeal in a valentines theme, add a valentines boarder and some valentines lights and some valentines hearts. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop."

//     // Step 3: Generate video with Replicate
//     let selectedPrompt = defaultPrompt;

//     switch (theme.toLowerCase()) {
//       case 'christmas':
//         selectedPrompt = xmasPrompt;
//         break;
//       case 'halloween':
//         selectedPrompt = halloweenPrompt;
//         break;
//       case 'valentines':
//         selectedPrompt = valentinesPrompt;
//         break;
//       default:
//         selectedPrompt = defaultPrompt;
//     }

//     const input = {
//       image: dataURI,
//       prompt: selectedPrompt
//     };

//     console.log('  🎨 Calling Replicate API for theme:', theme);
//     const output = await replicate.run("wan-video/wan-2.2-i2v-fast", { input });

//     console.log('  📥 Downloading video from Replicate...');

//     // Step 4: Save video to temp file
//     const videoFileName = `video-${Date.now()}.mp4`;
//     const videoPath = path.join(tempDir, videoFileName);

//     // Write the file to disk using the proper method (matching your working POC)
//     await fs.promises.writeFile(videoPath, output);
//     console.log('  ✅ Video saved to:', videoPath);

//     // Step 5: Optimize MP4 for web compatibility
//     console.log('  🔧 Optimizing MP4 for web...');
//     const optimizedFileName = `video-optimized-${Date.now()}.mp4`;
//     const optimizedPath = path.join(tempDir, optimizedFileName);

//     try {
//       await execPromise(`ffmpeg -i "${videoPath}" -c:v libx264 -crf 23 -preset fast -pix_fmt yuv420p -movflags +faststart -an "${optimizedPath}"`);
//       console.log('  ✅ Video optimized for web');
//     } catch (ffmpegError) {
//       console.warn('  ⚠️ FFmpeg optimization failed, using original video:', ffmpegError);
//       // If ffmpeg fails, use the original video
//       return videoPath;
//     }

//     // Cleanup original video file
//     try {
//       fs.unlinkSync(videoPath);
//     } catch (cleanupError) {
//       console.warn('  ⚠️ Failed to cleanup original video:', cleanupError);
//     }

//     // Cleanup image file
//     try {
//       fs.unlinkSync(imagePath);
//     } catch (cleanupError) {
//       console.warn('  ⚠️ Failed to cleanup image:', cleanupError);
//     }

//     return optimizedPath;

//   } catch (error) {
//     console.error('  ❌ Replicate generation failed:', error);

//     // Handle rate limiting specifically
//     if (error instanceof Error && (error.message.includes('429') || error.message.includes('rate limit'))) {
//       console.log('  ⏳ Rate limit hit, will retry after delay...');
//       throw new Error('Rate limit exceeded - will retry');
//     }

//     throw error;
//   }
// }

// async function generateImageAndVideoWithPrompt(imageUrl, customPrompt, theme = 'default') {
//   const replicate = new Replicate({
//     auth: process.env.REPLICATE_API_TOKEN,
//   });

//   console.log('  🎨 Generating AI image and video with custom prompt...');

//   try {
//     // Step 1: Download image to temp file
//     const tempDir = path.join(process.cwd(), 'temp');
//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir, { recursive: true });
//     }

//     const imageFileName = `image-${Date.now()}.jpg`;
//     const imagePath = path.join(tempDir, imageFileName);

//     console.log('  📥 Downloading image...');
//     const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
//     const writer = fs.createWriteStream(imagePath);
//     imageResponse.data.pipe(writer);

//     await new Promise((resolve, reject) => {
//       writer.on('finish', () => resolve());
//       writer.on('error', reject);
//     });

//     console.log('  📥 Image downloaded to:', imagePath);

//     // Step 2: Convert image to base64 data URI
//     const imageBase64 = fs.readFileSync(imagePath, 'base64');
//     const dataURI = `data:image/jpeg;base64,${imageBase64}`;

//     // Step 3: Generate image with nano-banana using custom prompt
//     console.log('  🎨 Calling nano-banana API with custom prompt...');
//     const imageInput = {
//       prompt: ,
//       image_input: [dataURI]
//     };

//     const imageOutput = await replicate.run("google/nano-banana", { input: imageInput });

//     // Step 4: Save generated image
//     const generatedImageFileName = `generated-image-${Date.now()}.jpg`;
//     const generatedImagePath = path.join(tempDir, generatedImageFileName);
//     await fs.promises.writeFile(generatedImagePath, imageOutput);
//     console.log('  ✅ Generated image saved to:', generatedImagePath);

//     // Step 5: Convert generated image to base64 data URI for video generation
//     const generatedImageBase64 = fs.readFileSync(generatedImagePath, 'base64');
//     const generatedDataURI = `data:image/jpeg;base64,${generatedImageBase64}`;

//     // Step 5: Define video prompts based on theme
//     const xmasPrompt = "Create a beautiful animation that enhances the appeal. if there is a face in the image, add a santa hat and some christmas lights overlay over the image. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop."
//     const defaultPrompt = "This is an online casino game thumbnail. Create a beautiful animation that enhances the appeal. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop."
//     const halloweenPrompt = "Create a beautiful animation that enhances the appeal in a halloween theme, add a halloween boarder and some halloween lights and some halloween ghosts. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop."
//     const valentinesPrompt = "Create a beautiful animation that enhances the appeal in a valentines theme, add a valentines boarder and some valentines lights and some valentines hearts. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop."

//     // Step 6: Generate video with wan-video using theme-based prompt
//     let selectedVideoPrompt = defaultPrompt;

//     switch (theme.toLowerCase()) {
//       case 'christmas':
//         selectedVideoPrompt = xmasPrompt;
//         break;
//       case 'halloween':
//         selectedVideoPrompt = halloweenPrompt;
//         break;
//       case 'valentines':
//         selectedVideoPrompt = valentinesPrompt;
//         break;
//       default:
//         selectedVideoPrompt = defaultPrompt;
//     }

//     console.log('  🎨 Calling wan-video API for theme:', theme);
//     const videoInput = {
//       image: generatedDataURI,
//       prompt: selectedVideoPrompt
//     };

//     const videoOutput = await replicate.run("wan-video/wan-2.2-i2v-fast", { input: videoInput });

//     // Step 7: Save video to temp file
//     const videoFileName = `video-${Date.now()}.mp4`;
//     const videoPath = path.join(tempDir, videoFileName);
//     await fs.promises.writeFile(videoPath, videoOutput);
//     console.log('  ✅ Video saved to:', videoPath);

//     // Step 8: Optimize MP4 for web compatibility
//     console.log('  🔧 Optimizing MP4 for web...');
//     const optimizedFileName = `video-optimized-${Date.now()}.mp4`;
//     const optimizedPath = path.join(tempDir, optimizedFileName);

//     try {
//       await execPromise(`ffmpeg -i "${videoPath}" -c:v libx264 -crf 23 -preset fast -pix_fmt yuv420p -movflags +faststart -an "${optimizedPath}"`);
//       console.log('  ✅ Video optimized for web');
      
//       // Cleanup original video file
//       try {
//         fs.unlinkSync(videoPath);
//       } catch (cleanupError) {
//         console.warn('  ⚠️ Failed to cleanup original video:', cleanupError);
//       }
//     } catch (ffmpegError) {
//       console.warn('  ⚠️ FFmpeg optimization failed, using original video:', ffmpegError);
//       // If ffmpeg fails, use the original video
//       const optimizedPath = videoPath;
//     }

//     // Cleanup original downloaded image file
//     try {
//       fs.unlinkSync(imagePath);
//     } catch (cleanupError) {
//       console.warn('  ⚠️ Failed to cleanup original image:', cleanupError);
//     }

//     return {
//       imagePath: generatedImagePath,
//       videoPath: optimizedPath
//     };

//   } catch (error) {
//     console.error('  ❌ Generation failed:', error);

//     // Handle rate limiting specifically
//     if (error instanceof Error && (error.message.includes('429') || error.message.includes('rate limit'))) {
//       console.log('  ⏳ Rate limit hit, will retry after delay...');
//       throw new Error('Rate limit exceeded - will retry');
//     }

//     throw error;
//   }
// }

// module.exports = {
//   generateImageWithReplicate,
//   generateVideoWithReplicate,
//   generateImageAndVideoWithPrompt
// };


async function generateImageAndVideoWithPrompt(imageUrl, prompt = '', theme = 'default', assetType = 'original', userId = null, accountId = null, gameId = null) {

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
    
    // Short circuit for non-original assets during testing
    if (assetType !== 'original') {
      console.log('⚠️ Short-circuiting: Only original asset type is allowed during testing');
      throw new Error('Only original asset type is allowed during testing');
    }
    
    // Get or create CDN configuration
    let cdnConfig = null;
    if (userId && accountId) {
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
    } else {
        console.log('⚠️ Missing userId or accountId - CDN upload will be skipped');
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  
    console.log('  🎨 Generating AI image and video...');
    console.log('  📋 Asset Type:', assetType);
    console.log('  🎭 Theme:', theme);
  
    try {
      // Branch based on assetType
      if (assetType === 'original') {
        // For 'original' assetType: Use imageUrl directly, skip AI image generation, generate video only
        console.log('  🎯 Processing original asset - skipping AI image generation');
        
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
        
        // Upload only video to CDN
        const result = await uploadAssetsToStorage(assetType, cdnConfig, null, optimizedPath);
        
        // Update MongoDB game collection for test video only
        if (gameId && result.testVideoUrl) {
          try {
            console.log('📝 Updating game testVideo field in MongoDB...');
            await game.update({ 
              id: gameId, 
              user: userId, 
              data: { 
                testVideo: result.testVideoUrl
              } 
            });
            console.log('✅ Successfully updated game testVideo field');
          } catch (error) {
            console.error('❌ Failed to update game testVideo field:', error.message);
            // Don't throw here - we still want to return the result
          }
        }
        
        // Cleanup temporary files
        try {
          fs.unlinkSync(imagePath);
          console.log('✅ Cleaned up original image');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup original image:', cleanupError);
        }
        
        try {
          fs.unlinkSync(optimizedPath);
          console.log('✅ Cleaned up optimized video');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup optimized video:', cleanupError);
        }
        
        // Return specific payload format for original assets
        return {
          assetType: 'original',
          media: 'video',
          url: result.testVideoUrl
        };
        
      } else {
        // For 'current' and 'theme' assetTypes: Generate AI image first, then video from AI image
        console.log('  🎯 Processing current/theme asset - generating AI image first');
        
        // Download original image
        const imagePath = await downloadImageToTemp(imageUrl);
        
        // Convert to data URI
        const dataURI = convertImageToDataURI(imagePath);
        
        // Build image generation prompt
        const finalImagePrompt = buildImagePrompt(assetType, theme, prompt);
        
        // Generate AI image
        const generatedImagePath = await generateAIImage(dataURI, finalImagePrompt, replicate);
        
        // Convert generated image to data URI for video generation
        const generatedDataURI = convertImageToDataURI(generatedImagePath);
        
        // Build video generation prompt
        const baseVideoPrompt = "This is an online casino game thumbnail. Create a beautiful animation that enhances the appeal. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop.";
        let finalVideoPrompt = baseVideoPrompt;

        // Append custom prompt if provided
        if (prompt && prompt.trim()) {
          finalVideoPrompt += ` ${prompt.trim()}`;
        }
        
        console.log('  📝 Video prompt:', finalVideoPrompt);
        
        // Generate video from AI image
        const videoPath = await generateAIVideo(generatedDataURI, finalVideoPrompt, replicate);
        
        // Optimize video for web
        const optimizedPath = await optimizeVideoForWeb(videoPath);
        
        // Upload both image and video to CDN
        const result = await uploadAssetsToStorage(assetType, cdnConfig, generatedImagePath, optimizedPath);
        
        // Cleanup temporary files
        try {
          fs.unlinkSync(imagePath);
          console.log('✅ Cleaned up original image');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup original image:', cleanupError);
        }
        
        try {
          fs.unlinkSync(generatedImagePath);
          console.log('✅ Cleaned up generated image');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup generated image:', cleanupError);
        }
        
        try {
          fs.unlinkSync(optimizedPath);
          console.log('✅ Cleaned up optimized video');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup optimized video:', cleanupError);
        }
        
        return result;
      }
  
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
    generateImageAndVideoWithPrompt
  };