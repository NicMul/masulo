const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { logStep, logError } = require('./logger');

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
  logStep('📥', 'Downloading image to temp directory...', { imageUrl });
  
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    logStep('📁', 'Created temp directory', { tempDir });
  }

  const imageFileName = `image-${Date.now()}.jpg`;
  const imagePath = path.join(tempDir, imageFileName);

  try {
    logStep('🔗', 'Fetching image from URL...');
    const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(imagePath);
    imageResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
    });

    logStep('✅', 'Image downloaded successfully', { imagePath });
    return imagePath;
  } catch (error) {
    logError('Failed to download image', error);
    throw error;
  }
}

// Helper function to convert image to data URI
function convertImageToDataURI(imagePath) {
  logStep('🔄', 'Converting image to data URI...', { imagePath });
  
  try {
    const imageBase64 = fs.readFileSync(imagePath, 'base64');
    const dataURI = `data:image/jpeg;base64,${imageBase64}`;
    logStep('✅', 'Image converted to data URI', { 
      dataURILength: dataURI.length,
      preview: dataURI.substring(0, 50) + '...'
    });
    return dataURI;
  } catch (error) {
    logError('Failed to convert image to data URI', error);
    throw error;
  }
}

// Helper function to optimize video for web
async function optimizeVideoForWeb(videoPath) {
  logStep('🔧', 'Optimizing MP4 for web...', { videoPath });
  
  const tempDir = path.join(process.cwd(), 'temp');
  const optimizedFileName = `video-optimized-${Date.now()}.mp4`;
  const optimizedPath = path.join(tempDir, optimizedFileName);

  try {
    // FFmpeg command: CRF 23, fast preset, yuv420p, faststart
    const ffmpegCmd = `ffmpeg -i "${videoPath}" -c:v libx264 -crf 23 -preset fast -pix_fmt yuv420p -movflags +faststart -an "${optimizedPath}"`;
    
    logStep('⚙️', 'Running FFmpeg optimization...');
    await execPromise(ffmpegCmd);
    logStep('✅', 'Video optimized for web', { optimizedPath });
    
    // Cleanup original video file
    try {
      fs.unlinkSync(videoPath);
      logStep('🗑️', 'Cleaned up original video file', { videoPath });
    } catch (cleanupError) {
      logError('Failed to cleanup original video', cleanupError);
    }
    
    return optimizedPath;
  } catch (ffmpegError) {
    logError('FFmpeg optimization failed, using original video', ffmpegError);
    // If ffmpeg fails, use the original video
    return videoPath;
  }
}

// Helper function to cleanup temporary files with error handling
function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logStep('🗑️', 'Cleaned up temp file', { filePath });
    }
  } catch (cleanupError) {
    logError('Failed to cleanup temp file', cleanupError);
  }
}

module.exports = {
  generateRandomString,
  downloadImageToTemp,
  convertImageToDataURI,
  optimizeVideoForWeb,
  cleanupTempFile
};

