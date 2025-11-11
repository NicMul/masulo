const dotenv = require('dotenv');
const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');
const game = require('../model/game');
const { logStep, logError, logSuccess } = require('../utils/logger');

// Load environment variables
dotenv.config();

// Initialize Replicate client
let replicate = null;

function getReplicateClient() {
  if (!replicate) {
    logStep('🔧', 'Initializing Replicate client...');
    replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    logStep('✅', 'Replicate client initialized');
  }
  return replicate;
}

// Helper function to generate AI image with Replicate
async function generateImage(imageDataURI, prompt, replicateClient) {
  try {
    const imageModel = process.env.MESULO_IMAGE_MODEL;
    logStep('🎨', `Calling ${imageModel} API for image generation...`);
    
    const imageInput = {
      prompt: prompt,
      image_input: [imageDataURI] // Nano Banana expects 'image_input' (with underscore) as an array
    };

    logStep('📋', 'Image model input prepared', { 
      model: imageModel,
      imageCount: imageInput.image_input.length, 
      promptLength: prompt.length,
      imagePreview: imageDataURI.substring(0, 50) + '...'
    });

    const imageOutput = await replicateClient.run(imageModel, { input: imageInput });

    // Save image to temp file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const imageFileName = `image-generated-${Date.now()}.jpg`;
    const imagePath = path.join(tempDir, imageFileName);
    
    // Write the output directly (Nano Banana returns binary data)
    await fs.promises.writeFile(imagePath, imageOutput);
    
    logSuccess('Image generated and saved', { imagePath });
    
    return imagePath;
  } catch (error) {
    logError('Failed to generate image', error);
    throw error;
  }
}

// Helper function to generate AI video with Replicate
async function generateVideo(imageDataURI, prompt, replicateClient) {
  try {
    const videoModel = process.env.MESULO_VIDEO_MODEL;
    logStep('🎥', `Calling ${videoModel} API for video generation...`);
    
    const videoInput = {
      image: imageDataURI,
      prompt: prompt
    };

    logStep('📋', 'Video model input prepared', { 
      model: videoModel,
      promptLength: prompt.length,
      imagePreview: imageDataURI.substring(0, 50) + '...'
    });

    const videoOutput = await replicateClient.run(videoModel, { input: videoInput });

    // Save video to temp file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const videoFileName = `video-${Date.now()}.mp4`;
    const videoPath = path.join(tempDir, videoFileName);
    
    await fs.promises.writeFile(videoPath, videoOutput);
    
    logSuccess('Video generated and saved', { videoPath });
    
    return videoPath;
  } catch (error) {
    logError('Failed to generate video', error);
    throw error;
  }
}

// Helper function to update database
async function updateDatabase(gameId, userId, updateData) {
  try {
    logStep('💾', 'Updating database...', { gameId, userId, updateData });
    
    const result = await game.update({ 
      id: gameId, 
      user: userId, 
      data: updateData
    });
    
    if (result) {
      logSuccess('Database updated successfully', { gameId });
    } else {
      logError('Database update failed - game not found', null);
    }
    
    return result;
  } catch (error) {
    logError('Failed to update database', error);
    throw error;
  }
}

module.exports = {
  getReplicateClient,
  generateImage,
  generateVideo,
  updateDatabase
};

