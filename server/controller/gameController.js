const joi = require('joi');
const fs = require('fs');
const csv = require('csv-parser');
const game = require('../model/game');
const utility = require('../helper/utility');

exports.create = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
    
    cmsId: joi.string().required(),
    defaultImage: joi.string().required(),
    defaultVideo: joi.string().allow('', null),
    currentImage: joi.string().allow('', null),
    currentVideo: joi.string().allow('', null),
    themeImage: joi.string().allow('', null),
    themeVideo: joi.string().allow('', null),
    testImage: joi.string().allow('', null),
    testVideo: joi.string().allow('', null),
    scrape: joi.boolean(),
    theme: joi.string().allow('', null),
    animate: joi.boolean().required(),
    hover: joi.boolean().required(),
    version: joi.number().required(),
    group: joi.string().allow(''),
    playerCss: joi.string().allow(''),
    touch: joi.boolean()

  }), req, res); 

  const gameData = await game.create({ data, user: req.user });
  return res.status(200).send({ message: res.__('game.create.success'), data: gameData });

}

exports.bulkCreate = async function(req, res){

  try {
    // debug logging
    console.log('Files received:', req.files);
    console.log('File received:', req.file);
    console.log('Body received:', req.body);

    // check if file was uploaded
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).send({ message: res.__('game.csv.file.error') });
    }

    // validate file type
    if (!req.file.mimetype.includes('csv') && !req.file.originalname.endsWith('.csv')) {
      return res.status(400).send({ message: res.__('game.csv.validation.invalid_format') });
    }

    const games = [];
    const errors = [];
    const requiredColumns = ['cmsId', 'defaultImage', 'animate', 'hover', 'version'];
    const optionalColumns = ['defaultVideo', 'currentImage', 'currentVideo', 'themeImage', 'themeVideo', 'testImage', 'testVideo'];
    const allColumns = [...requiredColumns, ...optionalColumns];
    let rowNumber = 0;

    // parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;
          
          // validate required columns
          const missingColumns = requiredColumns.filter(col => !row.hasOwnProperty(col));
          if (missingColumns.length > 0) {
            errors.push(`Row ${rowNumber}: Missing required columns: ${missingColumns.join(', ')}`);
            return;
          }

          // validate data types and values
          try {
            const gameData = {
              cmsId: row.cmsId?.trim(),
              defaultImage: row.defaultImage?.trim(),
              defaultVideo: row.defaultVideo?.trim() || '',
              currentImage: row.currentImage?.trim() || '',
              currentVideo: row.currentVideo?.trim() || '',
              themeImage: row.themeImage?.trim() || '',
              themeVideo: row.themeVideo?.trim() || '',
              testImage: row.testImage?.trim() || '',
              testVideo: row.testVideo?.trim() || '',
              animate: row.animate?.toLowerCase() === 'true' || row.animate === '1',
              hover: row.hover?.toLowerCase() === 'true' || row.hover === '1',
              version: parseInt(row.version)
            };

            // validate each field
            if (!gameData.cmsId) {
              errors.push(`Row ${rowNumber}: cmsId is required`);
              return;
            }
            if (!gameData.defaultImage) {
              errors.push(`Row ${rowNumber}: defaultImage is required`);
              return;
            }
            if (isNaN(gameData.version)) {
              errors.push(`Row ${rowNumber}: version must be a number`);
              return;
            }

            games.push(gameData);
          } catch (error) {
            errors.push(`Row ${rowNumber}: Invalid data - ${error.message}`);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // if there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).send({ 
        message: res.__('game.csv.validation.invalid_data'), 
        errors: errors 
      });
    }

    // if no valid games found
    if (games.length === 0) {
      return res.status(400).send({ message: res.__('game.csv.validation.invalid_data') });
    }

    // create all games
    const createdGames = [];
    for (const gameData of games) {
      try {
        const createdGame = await game.create({ data: gameData, user: req.user });
        createdGames.push(createdGame);
      } catch (error) {
        errors.push(`Failed to create game ${gameData.cmsId}: ${error.message}`);
      }
    }

    // clean up uploaded file
    fs.unlinkSync(req.file.path);

    // return results
    if (errors.length > 0) {
      return res.status(400).send({ 
        message: res.__('game.csv.error'), 
        errors: errors,
        data: createdGames 
      });
    }

    return res.status(200).send({ 
      message: res.__('game.csv.success'), 
      data: createdGames,
      count: createdGames.length 
    });

  } catch (error) {
    // clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).send({ message: res.__('game.csv.error') });
  }

}

exports.downloadTemplate = async function(req, res){

  // CSV template with ALL headers and example data
  const csvContent = [
    'cmsId,defaultImage,defaultVideo,currentImage,currentVideo,themeImage,themeVideo,testImage,testVideo,scrape,theme,animate,hover,version,group',
    'game-001,https://example.com/image1.jpg,https://example.com/video1.mp4,https://example.com/current1.jpg,https://example.com/current1.mp4,https://example.com/theme1.jpg,https://example.com/theme1.mp4,https://example.com/test1.jpg,https://example.com/test1.mp4,true,default,true,false,1,group-1',
    'game-002,https://example.com/image2.jpg,,https://example.com/current2.jpg,,https://example.com/theme2.jpg,,https://example.com/test2.jpg,,false,xmas,false,true,2,group-2',
    'game-003,https://example.com/image3.jpg,https://example.com/video3.mp4,,,https://example.com/theme3.jpg,https://example.com/theme3.mp4,,,true,valentines,true,true,1,'
  ].join('\n');

  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="games_template.csv"');
  
  // Send the CSV content
  res.send(csvContent);

}

exports.get = async function(req, res){

  const games = await game.get({ id: req.params.id, user: req.user });
  res.status(200).send({ data: games });

}

exports.update = async function(req, res){

  utility.assert(req.params.id, res.__('game.update.id_required'));

  // validate
  const data = utility.validate(joi.object({
    
    cmsId: joi.string(),
    defaultImage: joi.string(),
    defaultVideo: joi.string().allow('', null),
    currentImage: joi.string().allow('', null),
    currentVideo: joi.string().allow('', null),
    themeImage: joi.string().allow('', null),
    themeVideo: joi.string().allow('', null),
    testImage: joi.string().allow('', null),
    testVideo: joi.string().allow('', null),
    scrape: joi.boolean(),
    theme: joi.string().allow('', null),
    animate: joi.boolean(),
    hover: joi.boolean(),
    version: joi.number(),
    group: joi.string().allow(''),
    playerCss: joi.string().allow(''),
    touch: joi.boolean()

  }), req, res); 

  const gameData = await game.update({ id: req.params.id, user: req.user, data });
  
  if (!gameData) {
    return res.status(404).send({ message: res.__('game.update.not_found') });
  }

  return res.status(200).send({ message: res.__('game.update.success'), data: gameData });

}

exports.delete = async function(req, res){

  utility.assert(req.params.id, res.__('game.delete.id_required'));
  
  const result = await game.delete({ id: req.params.id, user: req.user });
  
  if (result.deletedCount === 0) {
    return res.status(404).send({ message: res.__('game.delete.not_found') });
  }

  res.status(200).send({ message: res.__('game.delete.success') });

}

exports.deleteTestAssets = async function(req, res){

  utility.assert(req.params.id, res.__('game.update.id_required'));

  const data = {
    testImage: '',
    testVideo: ''
  };

  const gameData = await game.update({ id: req.params.id, user: req.user, data });
  
  if (!gameData) {
    return res.status(404).send({ message: res.__('game.update.not_found') });
  }

  return res.status(200).send({ message: res.__('game.update.success'), data: gameData });

}

exports.acceptTestAssets = async function(req, res){

  utility.assert(req.params.id, res.__('game.update.id_required'));

  try {
    // Get current game data to retrieve testVideo URL
    const gameData = await game.get({ id: req.params.id, user: req.user });
    
    if (!gameData || gameData.length === 0) {
      return res.status(404).send({ message: res.__('game.update.not_found') });
    }

    const currentGame = gameData[0];
    
    // Validate that testVideo field is not empty
    if (!currentGame.testVideo || currentGame.testVideo.trim() === '') {
      return res.status(400).send({ message: 'No test video to accept' });
    }

    // Import Bunny CDN functions
    const { 
      findCdnConfigurationByUserId, 
      downloadFromBunnyStorage, 
      uploadToBunnyStorage, 
      deleteFromBunnyStorage 
    } = require('../services/bunny-cdn');

    // Get user's CDN configuration
    const cdnConfig = await findCdnConfigurationByUserId(req.user, req.account);
    if (!cdnConfig) {
      return res.status(500).send({ message: 'CDN configuration not found' });
    }

    console.log('🎯 Accepting test assets for game:', req.params.id);
    console.log('📹 Test video URL:', currentGame.testVideo);

    // Step 1: Download the test video from /test/ directory
    const tempVideoPath = await downloadFromBunnyStorage(currentGame.testVideo, cdnConfig);

    // Step 2: Generate new filename for /videos/ directory
    const randomString = generateRandomString(9);
    const newVideoFilename = `default-${randomString}.mp4`;

    // Step 3: Upload video to /videos/ directory with new filename
    const newVideoUrl = await uploadToBunnyStorage(tempVideoPath, cdnConfig, 'videos', newVideoFilename);

    // Step 4: Delete test video from /test/ directory
    await deleteFromBunnyStorage(currentGame.testVideo, cdnConfig);

    // Step 5: Update game document
    const updateData = {
      testVideo: '', // Clear test video
      defaultVideo: newVideoUrl // Set new default video
    };

    const updatedGameData = await game.update({ id: req.params.id, user: req.user, data: updateData });
    
    if (!updatedGameData) {
      return res.status(500).send({ message: 'Failed to update game' });
    }

    // Step 6: Clean up temp file
    try {
      const fs = require('fs');
      fs.unlinkSync(tempVideoPath);
      console.log('✅ Cleaned up temp video file');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup temp video:', cleanupError);
    }

    console.log('✅ Test assets accepted successfully');
    console.log('📹 New default video URL:', newVideoUrl);

    return res.status(200).send({ 
      message: 'Test assets accepted successfully', 
      data: updatedGameData 
    });

  } catch (error) {
    console.error('❌ Error accepting test assets:', error);
    return res.status(500).send({ 
      message: 'Failed to accept test assets', 
      error: error.message 
    });
  }

}

// Helper function to generate random alphanumeric string
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
