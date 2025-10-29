const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// define schema
const GameSchema = new Schema({

  id: { type: String, required: true, unique: true },
  cmsId: { type: String, required: true },
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
* game.create()
* create a new game
*/

exports.create = async function({ data, user }){

  const newGame = Game({

    id: uuidv4(),
    cmsId: data.cmsId,
    defaultImage: data.defaultImage,
    defaultVideo: data.defaultVideo || null,
    currentImage: data.currentImage || null,
    currentVideo: data.currentVideo || null,
    themeImage: data.themeImage || null,
    themeVideo: data.themeVideo || null,
    testImage: data.testImage || null,
    testVideo: data.testVideo || null,
    scrape: data.scrape || false,
    theme: data.theme || null,
    animate: data.animate,
    hover: data.hover,
    version: data.version,
    group: data.group || '',
    playerCss: data.playerCss || '',
    touch: data.touch !== undefined ? data.touch : true,
    analytics: data.analytics !== undefined ? data.analytics : false,
    promoImage: data.promoImage || '',
    promoVideo: data.promoVideo || '',
    locked: data.locked !== undefined ? data.locked : false,
    published: data.published !== undefined ? data.published : false,
    publishedType: data.publishedType || 'default',
    user_id: user,
    date_created: new Date(),
    date_updated: new Date()

  });

  return await newGame.save();

}

/*
* game.get()
* get games for a user (single game by id or all games)
*/

exports.get = async function({ id, user }){

  const query = { user_id: user };
  if (id) query.id = id;

  const data = await Game.find(query).sort({ date_created: -1 });

  return data;

}

/*
* game.getByIds()
* get games by multiple IDs (for SDK requests)
*/

exports.getByIds = async function(gameIds){
  
  const data = await Game.find({ id: { $in: gameIds } }).sort({ date_created: -1 });
  
  return data;
  
}

/*
* game.update()
* update a game by id and user_id
*/

exports.update = async function({ id, user, data }){

  const updateData = {
    ...data,
    date_updated: new Date()
  };

  const result = await Game.findOneAndUpdate(
    { id: id, user_id: user },
    { $set: updateData },
    { new: true }
  );

  return result;

}

/*
* game.delete()
* delete a game by id and user_id
*/

exports.delete = async function({ id, user }){

  return await Game.deleteOne({ id: id, user_id: user });

}
