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
  animate: { type: Boolean, required: true },
  hover: { type: Boolean, required: true },
  version: { type: Number, required: true },
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
    animate: data.animate,
    hover: data.hover,
    version: data.version,
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
