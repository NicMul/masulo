const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// define schema
const AnalyticsSchema = new Schema({

  id: { type: String, required: true, unique: true },
  eventType: { type: String, required: true }, // hover, click, touch, video_play, video_pause, video_ended, video_hover, image_impression
  gameId: { type: String, required: true },
  assetType: { type: String, required: true },
  assetUrl: { type: String, required: true },
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  accountId: { type: String, required: true },
  metadata: { type: Object, default: {} },
  timestamp: { type: String, required: true },
  variantId: { type: String, default: null },
  date_created: Date,
  date_updated: Date

});

const Analytics = mongoose.model('Analytics', AnalyticsSchema, 'analytics');

/*
* analytics.create()
* create a new analytics event
*/

exports.create = async function({ data, user, account }){

  const newAnalytics = Analytics({

    id: data.id || uuidv4(),
    eventType: data.eventType,
    gameId: data.gameId,
    assetType: data.assetType,
    assetUrl: data.assetUrl,
    sessionId: data.sessionId,
    userId: user || data.userId,
    accountId: account || data.accountId,
    metadata: data.metadata || {},
    timestamp: data.timestamp || new Date().toISOString(),
    variantId: data.variantId || null,
    date_created: new Date(),
    date_updated: new Date()

  });

  return await newAnalytics.save();

}

/*
* analytics.createMany()
* create multiple analytics events (bulk insert)
*/

exports.createMany = async function({ events, user, account }){
  
  if (!events || !Array.isArray(events) || events.length === 0) {
    return { insertedCount: 0 };
  }

  console.log('[Analytics] createMany called:', {
    eventCount: events.length,
    userId: user,
    accountId: account
  });

  const documents = events.map(data => ({
    id: data.id || uuidv4(),
    eventType: data.eventType,
    gameId: data.gameId,
    assetType: data.assetType,
    assetUrl: data.assetUrl,
    sessionId: data.sessionId,
    userId: user || data.userId,
    accountId: account || data.accountId,
    metadata: data.metadata || {},
    timestamp: data.timestamp || new Date().toISOString(),
    variantId: data.variantId || null,
    date_created: new Date(),
    date_updated: new Date()
  }));

  try {
    const result = await Analytics.insertMany(documents, { 
      ordered: false
    });
    
    const insertedCount = Array.isArray(result) 
      ? result.length 
      : (result?.insertedCount || 0);
    
    return { insertedCount };
  } catch (error) {
    console.error('[Analytics] Bulk insert error:', error);
    console.error('[Analytics] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      writeErrors: error.writeErrors?.length || 0,
      insertedDocs: error.insertedDocs?.length || 0
    });
    
    // Return partial success if some documents were inserted
    if (error.insertedDocs && error.insertedDocs.length > 0) {
      console.log('[Analytics] Partial success:', {
        insertedCount: error.insertedDocs.length,
        failedCount: error.writeErrors?.length || 0
      });
      return { insertedCount: error.insertedDocs.length };
    }
    
    throw error;
  }
}

/*
* analytics.get()
* get analytics events (single entry by id, filtered by query, or all entries)
*/

exports.get = async function({ id, gameId, userId, accountId, eventType, assetType, sessionId, startDate, endDate, limit = 100, offset = 0 }){

  const query = {};
  
  if (id) query.id = id;
  if (gameId) query.gameId = gameId;
  if (userId) query.userId = userId;
  if (accountId) query.accountId = accountId;
  if (eventType) query.eventType = eventType;
  if (assetType) query.assetType = assetType;
  if (sessionId) query.sessionId = sessionId;
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  const data = await Analytics.find(query)
    .sort({ date_created: -1 })
    .limit(limit)
    .skip(offset);

  return data;

}

/*
* analytics.getById()
* get a single analytics event by id
*/

exports.getById = async function(id){

  return await Analytics.findOne({ id: id });

}

/*
* analytics.update()
* update an analytics event by id
*/

exports.update = async function({ id, data }){

  const updateData = {
    ...data,
    date_updated: new Date()
  };

  const result = await Analytics.findOneAndUpdate(
    { id: id },
    { $set: updateData },
    { new: true }
  );

  return result;

}

/*
* analytics.delete()
* delete an analytics event by id
*/

exports.delete = async function({ id }){

  return await Analytics.deleteOne({ id: id });

}

/*
* analytics.deleteMany()
* delete multiple analytics events by query
*/

exports.deleteMany = async function({ gameId, userId, accountId }){

  const query = {};
  
  if (gameId) query.gameId = gameId;
  if (userId) query.userId = userId;
  if (accountId) query.accountId = accountId;

  return await Analytics.deleteMany(query);

}

/*
* analytics.aggregate()
* run aggregation queries on analytics data
*/

exports.aggregate = async function(pipeline){

  return await Analytics.aggregate(pipeline);

}

exports.schema = AnalyticsSchema;
exports.model = Analytics;

