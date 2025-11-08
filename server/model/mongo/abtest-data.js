const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// define schema
const ABTestDataSchema = new Schema({

  id: { type: String, required: true, unique: true },
  gameId: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  userId: { type: String, required: true },
  accountId: { type: String, required: true },
  eventType: { type: String, required: true },
  variant: { 
    type: String, 
    required: true, 
    enum: ['variantA', 'variantB']
  },
  timestamp: { type: String, required: true },
  distributionWeight: { type: Number, required: true },
  device: { 
    type: String, 
    required: true, 
    enum: ['mobile', 'desktop']
  },
  data: { type: Object, default: {} },
  date_created: Date,
  date_updated: Date

});

const ABTestData = mongoose.model('ABTestData', ABTestDataSchema, 'abtestdata');

/*
* abtestdata.create()
* create a new AB test data entry
*/

exports.create = async function({ data, user, account }){

  const newABTestData = ABTestData({

    id: data.id || uuidv4(),
    gameId: data.gameId,
    start: data.start,
    end: data.end,
    userId: user || data.userId,
    accountId: account || data.accountId,
    eventType: data.eventType,
    variant: data.variant,
    timestamp: data.timestamp || new Date().toISOString(),
    distributionWeight: data.distributionWeight,
    device: data.device,
    data: data.data || {},
    date_created: new Date(),
    date_updated: new Date()

  });

  return await newABTestData.save();

}

/*
* abtestdata.get()
* get AB test data entries (single entry by id, filtered by query, or all entries)
*/

exports.get = async function({ id, gameId, userId, accountId, variant, eventType, device }){

  const query = {};
  
  if (id) query.id = id;
  if (gameId) query.gameId = gameId;
  if (userId) query.userId = userId;
  if (accountId) query.accountId = accountId;
  if (variant) query.variant = variant;
  if (eventType) query.eventType = eventType;
  if (device) query.device = device;

  const data = await ABTestData.find(query).sort({ date_created: -1 });

  return data;

}

/*
* abtestdata.getById()
* get a single AB test data entry by id
*/

exports.getById = async function(id){

  return await ABTestData.findOne({ id: id });

}

/*
* abtestdata.update()
* update an AB test data entry by id
*/

exports.update = async function({ id, data }){

  const updateData = {
    ...data,
    date_updated: new Date()
  };

  const result = await ABTestData.findOneAndUpdate(
    { id: id },
    { $set: updateData },
    { new: true }
  );

  return result;

}

/*
* abtestdata.delete()
* delete an AB test data entry by id
*/

exports.delete = async function({ id }){

  return await ABTestData.deleteOne({ id: id });

}

/*
* abtestdata.deleteMany()
* delete multiple AB test data entries by query
*/

exports.deleteMany = async function({ gameId, userId, accountId }){

  const query = {};
  
  if (gameId) query.gameId = gameId;
  if (userId) query.userId = userId;
  if (accountId) query.accountId = accountId;

  return await ABTestData.deleteMany(query);

}

/*
* abtestdata.aggregate()
* run aggregation queries on AB test data
*/

exports.aggregate = async function(pipeline){

  return await ABTestData.aggregate(pipeline);

}

exports.schema = ABTestDataSchema;
exports.model = ABTestData;

