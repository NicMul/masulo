const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cdnModel = require('../model/cdn');
const { logStep, logError, logSuccess } = require('../utils/logger');

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
  logStep('🔧', 'Getting CDN configuration...', { userId, accountId });
  
  try {
    // Check if CDN configuration exists
    const cdnConfigurations = await cdnModel.get({ user: userId, account: accountId });
    
    if (cdnConfigurations && cdnConfigurations.length > 0) {
      logStep('✅', 'Found existing CDN configuration', {
        storageZoneName: cdnConfigurations[0].storageZoneName,
        cdnUrl: cdnConfigurations[0].cdnUrl
      });
      return cdnConfigurations[0]; // Return the first one
    } else {
      logStep('ℹ️', 'No CDN configuration found');
      return null;
    }
  } catch (error) {
    logError('Error checking CDN configuration', error);
    throw error;
  }
}

// Main function to create CDN configuration
async function createCdnConfiguration(userId, accountId) {
  logStep('📦', 'Creating new CDN configuration...', { userId, accountId });
  
  try {
    // Step 1: Check if CDN configuration already exists
    const existing = await findCdnConfigurationByUserId(userId, accountId);
    if (existing) {
      logStep('ℹ️', 'CDN already configured, using existing', { cdnId: existing.id });
      return existing;
    }

    const bunnyApiKey = process.env.BUNNY_API_KEY;
    if (!bunnyApiKey) {
      throw new Error('BUNNY_API_KEY environment variable is not set');
    }
    
    const randomName = generateRandomString(7);
    
    // Step 2: Create storage zone
    logStep('🏗️', 'Creating storage zone...', { name: randomName });
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

    logStep('✅', 'Storage zone created', { storageZoneName, storageZoneId });

    // Step 2.5: Get storage zone details to retrieve the correct API key
    logStep('🔑', 'Getting storage zone details for API key...');
    const storageZoneDetailsResponse = await axios.get(`https://api.bunny.net/storagezone/${storageZoneId}`, {
      headers: {
        'AccessKey': bunnyApiKey,
        'Content-Type': 'application/json'
      }
    });

    const storageApiKey = storageZoneDetailsResponse.data.Password;
    logStep('✅', 'Storage API key retrieved');

    // Step 3: Create pull zone
    logStep('🏗️', 'Creating pull zone...');
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

    logStep('✅', 'Pull zone created', { pullZoneName, pullZoneId, cdnUrl });

    // Step 4: Enable optimization
    logStep('⚙️', 'Enabling web optimization...');
    await axios.post(`https://api.bunny.net/pullzone/${pullZoneId}`, {
      OptimizerEnabled: true,
      OptimizerAutomaticOptimizationEnabled: true
    }, {
      headers: {
        'AccessKey': bunnyApiKey,
        'Content-Type': 'application/json'
      }
    });

    logStep('✅', 'Web optimization enabled');

    // Step 5: Save CDN configuration to database
    logStep('💾', 'Saving CDN configuration to database...');
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

    logStep('✅', 'CDN configuration saved to database', {
      storageZoneName: savedCdn.storageZoneName,
      cdnUrl: savedCdn.cdnUrl
    });

    // Step 6: Return the configuration
    return savedCdn;

  } catch (error) {
    logError('Error creating CDN configuration', error);
    if (error.response) {
      logError('Bunny API Error', error.response.data);
    }
    throw error;
  }
}

// Helper function to upload file to Bunny storage
async function uploadToBunnyStorage(filePath, cdnConfig, folder, filename) {
  try {
    logStep('📤', 'Uploading file to Bunny storage...', { filename, folder });
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to Bunny storage
    // Handle root folder case (empty folder string)
    const uploadUrl = folder 
      ? `https://storage.bunnycdn.com/${cdnConfig.storageZoneName}/${folder}/${filename}`
      : `https://storage.bunnycdn.com/${cdnConfig.storageZoneName}/${filename}`;
    
    logStep('🔗', 'Upload URL', { uploadUrl });
    
    const response = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        'AccessKey': cdnConfig.storageKey,
        'Content-Type': folder === 'images' ? 'image/jpeg' : 'video/mp4'
      }
    });
    
    // Construct CDN URL
    const cdnUrl = folder 
      ? `https://${cdnConfig.cdnUrl}/${folder}/${filename}`
      : `https://${cdnConfig.cdnUrl}/${filename}`;
    
    logSuccess('Upload successful', { cdnUrl });
    
    return cdnUrl;
  } catch (error) {
    logError(`Upload failed for ${filename}`, error);
    throw error;
  }
}

// Export the functions for use in other modules
module.exports = {
  findCdnConfigurationByUserId,
  createCdnConfiguration,
  uploadToBunnyStorage
};

