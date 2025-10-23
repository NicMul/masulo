const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// define schema
const ThemeSchema = new Schema({

  id: { type: String, required: true, unique: true },
  cmsThemeId: { type: String, required: true },
  friendlyName: { type: String, required: true },
  description: { type: String, required: true },
  user_id: { type: String, required: true },
  date_created: Date,
  date_updated: Date

});

const Theme = mongoose.model('Theme', ThemeSchema, 'theme');

/*
* theme.create()
* create a new theme
*/

exports.create = async function({ data, user }){

  const newTheme = Theme({

    id: uuidv4(),
    cmsThemeId: data.cmsThemeId,
    friendlyName: data.friendlyName,
    description: data.description,
    user_id: user,
    date_created: new Date(),
    date_updated: new Date()

  });

  return await newTheme.save();

}

/*
* theme.get()
* get themes for a user (single theme by id or all themes)
*/

exports.get = async function({ id, user }){

  const query = { user_id: user };
  if (id) query.id = id;

  const data = await Theme.find(query).sort({ date_created: -1 });

  return data;

}

/*
* theme.update()
* update a theme by id and user_id
*/

exports.update = async function({ id, user, data }){

  const updateData = {
    ...data,
    date_updated: new Date()
  };

  const result = await Theme.findOneAndUpdate(
    { id: id, user_id: user },
    { $set: updateData },
    { new: true }
  );

  return result;

}

/*
* theme.delete()
* delete a theme by id and user_id
*/

exports.delete = async function({ id, user }){

  return await Theme.deleteOne({ id: id, user_id: user });

}
