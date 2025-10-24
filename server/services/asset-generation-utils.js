const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const Replicate = require('replicate');
const { promisify } = require('util');

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

// Helper function to cleanup temporary files with error handling
function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Cleaned up temp file:', filePath);
    }
  } catch (cleanupError) {
    console.warn('⚠️ Failed to cleanup temp file:', filePath, cleanupError);
  }
}

module.exports = {
  generateRandomString,
  downloadImageToTemp,
  convertImageToDataURI,
  generateAIVideo,
  optimizeVideoForWeb,
  cleanupTempFile
};
