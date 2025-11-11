const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;
const { logStep, logError } = require('../utils/logger');

// define schema
const GameSchema = new Schema({

  id: { type: String, required: true, unique: true },
  cmsId: { type: String, required: true },
  friendlyName: { type: String, required: true },
  defaultImage: { type: String, required: true },
  defaultVideo: { type: String },
  currentImage: { type: String },
  currentVideo: { type: String },
  themeImage: { type: String },
  themeVideo: { type: String },
  testImage: { type: String },
  testVideo: { type: String },
  scrape: { type: Boolean, default: false },
  theme: { type: String },
  animate: { type: Boolean, required: true },
  hover: { type: Boolean, required: true },
  version: { type: Number, required: true },
  group: { type: String, default: '' },
  playerCss: { type: String, default: '' },
  touch: { type: Boolean, default: true },
  analytics: { type: Boolean, default: false },
  promoImage: { type: String, default: '' },
  promoVideo: { type: String, default: '' },
  locked: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  publishedType: { type: String, enum: ['default', 'current', 'theme', 'promo'], default: 'default' },
  user_id: { type: String, required: true },
  date_created: Date,
  date_updated: Date

});

const Game = mongoose.model('Game', GameSchema, 'game');

/*
* game.update()
* update a game by id and user_id
*/

exports.update = async function({ id, user, data }){
  try {
    logStep('📝', 'Updating game in MongoDB...', { gameId: id, userId: user, updateData: data });

    const updateData = {
      ...data,
      date_updated: new Date()
    };

    const result = await Game.findOneAndUpdate(
      { id: id, user_id: user },
      { $set: updateData },
      { new: true }
    );

    if (result) {
      logStep('✅', 'Game updated successfully', { gameId: id });
    } else {
      logError('Game not found or update failed', new Error('Game not found'));
    }

    return result;
  } catch (error) {
    logError('Failed to update game', error);
    throw error;
  }
};

