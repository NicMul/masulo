const axios = require('axios');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Replicate = require('replicate');
const { promisify } = require('util');

// Load environment variables
dotenv.config();

const execPromise = promisify(exec);

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


async function generateImageAndVideoWithPrompt(imageUrl, prompt = '', theme = 'default', assetType = 'default') {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  
    console.log('  🎨 Generating AI image and video...');
    console.log('  📋 Asset Type:', assetType);
    console.log('  🎭 Theme:', theme);
  
    try {
      // Step 1: Download image to temp file
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
  
      // Step 2: Convert image to base64 data URI
      const imageBase64 = fs.readFileSync(imagePath, 'base64');
      const dataURI = `data:image/jpeg;base64,${imageBase64}`;
  
      // Step 3: Build image generation prompt based on assetType
      let finalImagePrompt = '';
  
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
      if (prompt && prompt.trim()) {
        finalImagePrompt += ` ${prompt.trim()}`;
      }
  
      console.log('  📝 Image prompt:', finalImagePrompt);
  
      // Step 4: Generate image with nano-banana
      console.log('  🎨 Calling nano-banana API...');
      const imageInput = {
        prompt: finalImagePrompt,
        image_input: [dataURI]
      };
  
      const imageOutput = await replicate.run("google/nano-banana", { input: imageInput });
  
      // Step 5: Save generated image
      const generatedImageFileName = `generated-image-${Date.now()}.jpg`;
      const generatedImagePath = path.join(tempDir, generatedImageFileName);
      await fs.promises.writeFile(generatedImagePath, imageOutput);
      console.log('  ✅ Generated image saved to:', generatedImagePath);
  
      // Step 6: Convert generated image to base64 data URI for video generation
      const generatedImageBase64 = fs.readFileSync(generatedImagePath, 'base64');
      const generatedDataURI = `data:image/jpeg;base64,${generatedImageBase64}`;
  
      // Step 7: Build video generation prompt
      const baseVideoPrompt = "This is an online casino game thumbnail. Create a beautiful animation that enhances the appeal. The elements in the picture are cinematic and animate professionally. Where possible, use the game's theme color for the animation. Try to make the animation in a loop.";
      
      let finalVideoPrompt = baseVideoPrompt;

      // Append custom prompt if provided
      if (prompt && prompt.trim()) {
        finalVideoPrompt += ` ${prompt.trim()}`;
      }
  
      console.log('  📝 Video prompt:', finalVideoPrompt);
  
      // Step 8: Generate video with wan-video
      console.log('  🎥 Calling wan-video API...');
      const videoInput = {
        image: generatedDataURI,
        prompt: finalVideoPrompt
      };
  
      const videoOutput = await replicate.run("wan-video/wan-2.2-i2v-fast", { input: videoInput });
  
      // Step 9: Save video to temp file
      const videoFileName = `video-${Date.now()}.mp4`;
      const videoPath = path.join(tempDir, videoFileName);
      await fs.promises.writeFile(videoPath, videoOutput);
      console.log('  ✅ Video saved to:', videoPath);
  
      // Step 10: Optimize MP4 for web compatibility
      console.log('  🔧 Optimizing MP4 for web...');
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
      } catch (ffmpegError) {
        console.warn('  ⚠️ FFmpeg optimization failed, using original video:', ffmpegError);
        // If ffmpeg fails, use the original video
        optimizedPath = videoPath;
      }
  
      // Cleanup original downloaded image file
      try {
        fs.unlinkSync(imagePath);
      } catch (cleanupError) {
        console.warn('  ⚠️ Failed to cleanup original image:', cleanupError);
      }
  
      return {
        imagePath: generatedImagePath,
        videoPath: optimizedPath
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
    generateImageAndVideoWithPrompt
  };