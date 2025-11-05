const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// define schema
const ABTestSchema = new Schema({

  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  approvedBy: { type: String, default: '' },
  description: { type: String, required: true },
  endTime: { type: String, required: true },
  endDate: { type: String, required: true },
  gameId: { type: String, required: true },
  group: { type: String, required: true },
  published: { type: Boolean, default: false },
  startDate: { type: String, required: true },
  startTime: { type: String, required: true },
  analyticsId: { type: String, default: '' },
  imageVariantA: { type: String, required: true },
  videoVariantA: { type: String, required: true },
  imageVariantB: { type: String, required: true },
  videoVariantB: { type: String, required: true },
  user_id: { type: String, required: true },
  date_created: Date,
  date_updated: Date

});

const ABTest = mongoose.model('ABTest', ABTestSchema, 'abtest');

/*
* abtest.create()
* create a new AB test
*/

exports.create = async function({ data, user }){

  const newABTest = ABTest({

    id: uuidv4(),
    name: data.name,
    approvedBy: data.approvedBy || '',
    description: data.description,
    endTime: data.endTime,
    endDate: data.endDate,
    gameId: data.gameId,
    group: data.group,
    published: data.published !== undefined ? data.published : false,
    startDate: data.startDate,
    startTime: data.startTime,
    analyticsId: data.analyticsId || '',
    imageVariantA: data.imageVariantA,
    videoVariantA: data.videoVariantA,
    imageVariantB: data.imageVariantB,
    videoVariantB: data.videoVariantB,
    user_id: user,
    date_created: new Date(),
    date_updated: new Date()

  });

  return await newABTest.save();

}

/*
* abtest.get()
* get AB tests for a user (single test by id or all tests)
*/

exports.get = async function({ id, user }){

  const query = { user_id: user };
  if (id) query.id = id;

  const data = await ABTest.find(query).sort({ date_created: -1 });

  return data;

}

/*
* abtest.update()
* update an AB test by id and user_id
*/

exports.update = async function({ id, user, data }){

  const updateData = {
    ...data,
    date_updated: new Date()
  };

  const result = await ABTest.findOneAndUpdate(
    { id: id, user_id: user },
    { $set: updateData },
    { new: true }
  );

  return result;

}

/*
* abtest.delete()
* delete an AB test by id and user_id
*/

exports.delete = async function({ id, user }){

  return await ABTest.deleteOne({ id: id, user_id: user });

}

