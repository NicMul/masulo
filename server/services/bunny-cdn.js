const axios = require('axios');
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

// Export the functions for use in other modules
module.exports = {
  findCdnConfigurationByUserId,
  createCdnConfiguration
};



