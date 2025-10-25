const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// define schema
const AnalyticsSchema = new Schema({

  id: { type: String, required: true, unique: true },
  event_type: { type: String, required: true }, // hover, click, touch, video_play, video_pause, video_ended, video_hover, asset_changed, game_unpublished
  game_id: { type: String, required: true },
  asset_type: { type: String, required: true },
  asset_url: { type: String, required: true },
  session_id: { type: String, required: true },
  metadata: { type: Object },
  user_id: { type: String, required: true },
  timestamp: { type: Date, required: true },
  variant_id: { type: String, default: null }

});

const Analytics = mongoose.model('Analytics', AnalyticsSchema, 'analytics');

/*
* analytics.create()
* create a new analytics event
*/

exports.create = async function({ data, user, account }){

  data.id = uuidv4();
  data.user_id = user;
  data.account_id = account;
  data.timestamp = new Date();

  const newAnalytics = Analytics(data);
  await newAnalytics.save();
  return data;

}

/*
* analytics.get()
* get analytics events with optional filters
*/

exports.get = async function({ game_id, asset_type, event_type, user_id, session_id, start_date, end_date, limit = 100, offset = 0 }){

  const query = {};
  
  if (game_id) query.game_id = game_id;
  if (asset_type) query.asset_type = asset_type;
  if (event_type) query.event_type = event_type;
  if (user_id) query.user_id = user_id;
  if (session_id) query.session_id = session_id;
  
  if (start_date || end_date) {
    query.timestamp = {};
    if (start_date) query.timestamp.$gte = new Date(start_date);
    if (end_date) query.timestamp.$lte = new Date(end_date);
  }

  const data = await Analytics.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(offset);

  return data;

}

/*
* analytics.aggregate()
* get aggregated analytics data for reporting
*/

exports.aggregate = async function({ game_id, asset_type, event_type, user_id, start_date, end_date, groupBy = ['asset_type', 'event_type'] }){

  const matchQuery = {};
  
  if (game_id) matchQuery.game_id = game_id;
  if (asset_type) matchQuery.asset_type = asset_type;
  if (event_type) matchQuery.event_type = event_type;
  if (user_id) matchQuery.user_id = user_id;
  
  if (start_date || end_date) {
    matchQuery.timestamp = {};
    if (start_date) matchQuery.timestamp.$gte = new Date(start_date);
    if (end_date) matchQuery.timestamp.$lte = new Date(end_date);
  }

  const groupStage = { _id: {} };
  groupBy.forEach(field => {
    groupStage._id[field] = `$${field}`;
  });
  
  groupStage.count = { $sum: 1 };
  groupStage.first_seen = { $min: '$timestamp' };
  groupStage.last_seen = { $max: '$timestamp' };

  const pipeline = [
    { $match: matchQuery },
    { $group: groupStage },
    { $sort: { count: -1 } }
  ];

  const data = await Analytics.aggregate(pipeline);
  return data;

}

/*
* analytics.getByGame()
* get analytics for a specific game with asset breakdown
*/

exports.getByGame = async function(game_id, user_id, start_date, end_date){

  const matchQuery = { game_id, user_id };
  
  if (start_date || end_date) {
    matchQuery.timestamp = {};
    if (start_date) matchQuery.timestamp.$gte = new Date(start_date);
    if (end_date) matchQuery.timestamp.$lte = new Date(end_date);
  }

  const pipeline = [
    { $match: matchQuery },
    { 
      $group: { 
        _id: { 
          asset_type: '$asset_type',
          event_type: '$event_type'
        },
        count: { $sum: 1 },
        unique_sessions: { $addToSet: '$session_id' },
        first_seen: { $min: '$timestamp' },
        last_seen: { $max: '$timestamp' }
      }
    },
    {
      $addFields: {
        unique_session_count: { $size: '$unique_sessions' }
      }
    },
    { $sort: { count: -1 } }
  ];

  const data = await Analytics.aggregate(pipeline);
  return data;

}

/*
* analytics.delete()
* delete analytics events (for cleanup)
*/

exports.delete = async function(id){

  const result = await Analytics.findOneAndDelete({ id });
  return result;

}
