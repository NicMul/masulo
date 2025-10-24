const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cdnModel = require('../model/mongo/cdn');

// Helper function to generate random alphanumeric string
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function findCdnConfigurationByUserId(userId, accountId) {
  console.log(`Checking for CDN configuration for user: ${userId}, account: ${accountId}`);
  
  try {
    // Check if CDN configuration exists
    const cdnConfigurations = await cdnModel.get({ user: userId, account: accountId });
    
    if (cdnConfigurations && cdnConfigurations.length > 0) {
      console.log('Found existing CDN configuration(s):', cdnConfigurations);
      return cdnConfigurations[0]; // Return the first one
    } else {
      console.log('No CDN configuration found.');
      return null;
    }
  } catch (error) {
    console.error('Error checking CDN configuration:', error);
    throw error;
  }
}



// Main function to create CDN configuration
async function createCdnConfiguration(userId, accountId) {
  console.log(`Creating CDN configuration for user: ${userId}, account: ${accountId}`);
  
  try {
    // Step 1: Check if CDN configuration already exists
    const existing = await findCdnConfigurationByUserId(userId, accountId);
    if (existing) {
      console.log('CDN already configured:', existing);
      return existing;
    }

    const bunnyApiKey = process.env.BUNNY_API_KEY;
    if (!bunnyApiKey) {
      throw new Error('BUNNY_API_KEY environment variable is not set');
    }
    const randomName = generateRandomString(7);
    // Step 2: Create storage zone
    console.log('Creating storage zone...');
    const storageZoneResponse = await axios.post('https://api.bunny.net/storagezone', {
      Name: randomName,
      Region: 'DE'
    }, {
      headers: {
        'AccessKey': bunnyApiKey,
        'Content-Type': 'application/json'
      }
    });

    const storageZoneId = storageZoneResponse.data.Id;
    const storageZoneName = storageZoneResponse.data.Name;
    const storagePassword = storageZoneResponse.data.Password;

    console.log(`Storage zone created: ${storageZoneName} (ID: ${storageZoneId})`);

    // Step 2.5: Get storage zone details to retrieve the correct API key
    console.log('Getting storage zone details for API key...');
    const storageZoneDetailsResponse = await axios.get(`https://api.bunny.net/storagezone/${storageZoneId}`, {
      headers: {
        'AccessKey': bunnyApiKey,
        'Content-Type': 'application/json'
      }
    });

    const storageApiKey = storageZoneDetailsResponse.data.Password;
    console.log(`Storage API key retrieved: ${storageApiKey ? 'Yes' : 'No'}`);

    // Step 3: Create pull zone
    console.log('Creating pull zone...');
    const randomSuffix = generateRandomString(7);
    const pullZoneName = `casino-cdn-${randomSuffix}`;
    
    const pullZoneResponse = await axios.post('https://api.bunny.net/pullzone', {
      Name: pullZoneName,
      OriginUrl: `https://${storageZoneName}.b-cdn.net`,
      StorageZoneId: storageZoneId
    }, {
      headers: {
        'AccessKey': bunnyApiKey,
        'Content-Type': 'application/json'
      }
    });

    const pullZoneId = pullZoneResponse.data.Id;
    const cdnUrl = pullZoneResponse.data.Hostnames[0].Value;

    console.log(`Pull zone created: ${pullZoneName} (ID: ${pullZoneId})`);

    // Step 4: Enable optimization
    console.log('Enabling web optimization...');
    await axios.post(`https://api.bunny.net/pullzone/${pullZoneId}`, {
      OptimizerEnabled: true,
      OptimizerAutomaticOptimizationEnabled: true
    }, {
      headers: {
        'AccessKey': bunnyApiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('Web optimization enabled');

    // Step 5: Save CDN configuration to database
    console.log('Saving CDN configuration to database...');
    const cdnData = {
      storageZoneName: storageZoneName,
      storageZoneId: storageZoneId,
      storageZoneRegion: 'DE',
      pullZoneName: pullZoneName,
      pullZoneId: pullZoneId,
      cdnUrl: cdnUrl,
      storageKey: storageApiKey,
      optimization: true
    };

    const savedCdn = await cdnModel.create({
      data: cdnData,
      user: userId,
      account: accountId
    });

    console.log('CDN configuration saved to database');

    // Step 6: Return the configuration
    return savedCdn;

  } catch (error) {
    console.error('Error creating CDN configuration:', error.message);
    if (error.response) {
      console.error('Bunny API Error:', error.response.data);
    }
    throw error;
  }
}

// Helper function to download file from Bunny storage
async function downloadFromBunnyStorage(cdnUrl, cdnConfig) {
  try {
    console.log(`📥 Downloading file from Bunny storage: ${cdnUrl}`);
    
    // Extract storage zone name, folder, and filename from CDN URL
    // URL format: https://cdn.example.com/folder/filename.mp4
    const urlParts = cdnUrl.split('/');
    const folder = urlParts[urlParts.length - 2]; // second to last part
    const filename = urlParts[urlParts.length - 1]; // last part
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create unique filename for temp file
    const tempFilename = `download-${Date.now()}-${filename}`;
    const tempPath = path.join(tempDir, tempFilename);
    
    // Download file from Bunny storage
    const downloadUrl = `https://storage.bunnycdn.com/${cdnConfig.storageZoneName}/${folder}/${filename}`;
    
    const response = await axios.get(downloadUrl, {
      headers: {
        'AccessKey': cdnConfig.storageKey
      },
      responseType: 'stream'
    });
    
    // Save to temp file
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
    });
    
    console.log(`✅ File downloaded to: ${tempPath}`);
    return tempPath;
    
  } catch (error) {
    console.error(`❌ Download failed for ${cdnUrl}:`, error.message);
    throw error;
  }
}

// Helper function to delete file from Bunny storage
async function deleteFromBunnyStorage(cdnUrl, cdnConfig) {
  try {
    console.log(`🗑️ Deleting file from Bunny storage: ${cdnUrl}`);
    
    // Extract storage zone name, folder, and filename from CDN URL
    const urlParts = cdnUrl.split('/');
    const folder = urlParts[urlParts.length - 2];
    const filename = urlParts[urlParts.length - 1];
    
    // Delete file from Bunny storage
    const deleteUrl = `https://storage.bunnycdn.com/${cdnConfig.storageZoneName}/${folder}/${filename}`;
    
    await axios.delete(deleteUrl, {
      headers: {
        'AccessKey': cdnConfig.storageKey
      }
    });
    
    console.log(`✅ File deleted successfully: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Delete failed for ${cdnUrl}:`, error.message);
    throw error;
  }
}

// Helper function to upload file to Bunny storage
async function uploadToBunnyStorage(filePath, cdnConfig, folder, filename) {
  try {
    console.log(`📤 Uploading ${filename} to Bunny storage...`);
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to Bunny storage
    const uploadUrl = `https://storage.bunnycdn.com/${cdnConfig.storageZoneName}/${folder}/${filename}`;
    
    const response = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        'AccessKey': cdnConfig.storageKey,
        'Content-Type': folder === 'images' ? 'image/jpeg' : 'video/mp4'
      }
    });
    
    // Construct CDN URL
    const cdnUrl = `https://${cdnConfig.cdnUrl}/${folder}/${filename}`;
    console.log(`✅ Upload successful! CDN URL: ${cdnUrl}`);
    
    return cdnUrl;
  } catch (error) {
    console.error(`❌ Upload failed for ${filename}:`, error.message);
    throw error;
  }
}

// Helper function to list files in a Bunny storage folder
async function listFilesInFolder(cdnConfig, folder) {
  try {
    console.log(`📋 Listing files in folder: ${folder}`);
    
    // List files in Bunny storage folder
    const listUrl = `https://storage.bunnycdn.com/${cdnConfig.storageZoneName}/${folder}/`;
    
    const response = await axios.get(listUrl, {
      headers: {
        'AccessKey': cdnConfig.storageKey
      }
    });
    
    // Parse the response to get file list
    const files = response.data.map(file => ({
      name: file.ObjectName,
      size: file.Length,
      lastModified: file.LastChanged
    }));
    
    console.log(`✅ Found ${files.length} files in ${folder}`);
    return files;
    
  } catch (error) {
    console.error(`❌ Failed to list files in ${folder}:`, error.message);
    throw error;
  }
}

// Helper function to move file between folders
async function moveFileBetweenFolders(cdnUrl, cdnConfig, targetFolder) {
  try {
    console.log(`🔄 Moving file from ${cdnUrl} to ${targetFolder}/`);
    
    // Extract filename from URL
    const urlParts = cdnUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Download file from current location
    const tempPath = await downloadFromBunnyStorage(cdnUrl, cdnConfig);
    
    // Generate archived filename with timestamp
    const timestamp = Date.now();
    const fileExt = filename.split('.').pop();
    const baseName = filename.replace(`.${fileExt}`, '');
    const archivedFilename = `${baseName}-archived-${timestamp}.${fileExt}`;
    
    // Upload to target folder
    const newCdnUrl = await uploadToBunnyStorage(tempPath, cdnConfig, targetFolder, archivedFilename);
    
    // Delete from original location
    await deleteFromBunnyStorage(cdnUrl, cdnConfig);
    
    // Clean up temp file
    try {
      const fs = require('fs');
      fs.unlinkSync(tempPath);
      console.log('✅ Cleaned up temp file');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup temp file:', cleanupError);
    }
    
    console.log(`✅ File moved successfully: ${newCdnUrl}`);
    return newCdnUrl;
    
  } catch (error) {
    console.error(`❌ Failed to move file:`, error.message);
    throw error;
  }
}

// Export the functions for use in other modules
module.exports = {
  findCdnConfigurationByUserId,
  createCdnConfiguration,
  downloadFromBunnyStorage,
  deleteFromBunnyStorage,
  uploadToBunnyStorage,
  listFilesInFolder,
  moveFileBetweenFolders
};



