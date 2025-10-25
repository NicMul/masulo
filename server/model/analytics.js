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
* analytics.getAssetPerformanceComparison()
* compare performance of different asset types (default/theme/promo/current)
*/

exports.getAssetPerformanceComparison = async function({ user_id, start_date, end_date }){

  const matchQuery = { user_id };
  
  if (start_date || end_date) {
    matchQuery.timestamp = {};
    if (start_date) matchQuery.timestamp.$gte = new Date(start_date);
    if (end_date) matchQuery.timestamp.$lte = new Date(end_date);
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $addFields: {
        publishedType: {
          $cond: {
            if: { $regexMatch: { input: "$asset_type", regex: /^default/i } },
            then: "default",
            else: {
              $cond: {
                if: { $regexMatch: { input: "$asset_type", regex: /^theme/i } },
                then: "theme",
                else: {
                  $cond: {
                    if: { $regexMatch: { input: "$asset_type", regex: /^promo/i } },
                    then: "promo",
                    else: {
                      $cond: {
                        if: { $regexMatch: { input: "$asset_type", regex: /^current/i } },
                        then: "current",
                        else: "unknown"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: "$publishedType",
        total_interactions: { $sum: 1 },
        unique_sessions: { $addToSet: "$session_id" },
        clicks: { $sum: { $cond: [{ $eq: ["$event_type", "click"] }, 1, 0] } },
        hovers: { $sum: { $cond: [{ $eq: ["$event_type", "hover"] }, 1, 0] } },
        video_plays: { $sum: { $cond: [{ $eq: ["$event_type", "video_play"] }, 1, 0] } },
        video_ends: { $sum: { $cond: [{ $eq: ["$event_type", "video_ended"] }, 1, 0] } },
        avg_hover_duration: { $avg: "$metadata.hover_duration" },
        first_seen: { $min: "$timestamp" },
        last_seen: { $max: "$timestamp" }
      }
    },
    {
      $addFields: {
        unique_session_count: { $size: "$unique_sessions" },
        ctr: {
          $cond: {
            if: { $gt: ["$total_interactions", 0] },
            then: { $multiply: [{ $divide: ["$clicks", "$total_interactions"] }, 100] },
            else: 0
          }
        },
        hover_to_click_rate: {
          $cond: {
            if: { $gt: ["$hovers", 0] },
            then: { $multiply: [{ $divide: ["$clicks", "$hovers"] }, 100] },
            else: 0
          }
        },
        video_completion_rate: {
          $cond: {
            if: { $gt: ["$video_plays", 0] },
            then: { $multiply: [{ $divide: ["$video_ends", "$video_plays"] }, 100] },
            else: 0
          }
        }
      }
    },
    { $sort: { total_interactions: -1 } }
  ];

  const data = await Analytics.aggregate(pipeline);
  return data;

}

/*
* analytics.getConversionMetrics()
* calculate conversion metrics across all assets
*/

exports.getConversionMetrics = async function({ user_id, start_date, end_date }){

  const matchQuery = { user_id };
  
  if (start_date || end_date) {
    matchQuery.timestamp = {};
    if (start_date) matchQuery.timestamp.$gte = new Date(start_date);
    if (end_date) matchQuery.timestamp.$lte = new Date(end_date);
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total_interactions: { $sum: 1 },
        unique_sessions: { $addToSet: "$session_id" },
        clicks: { $sum: { $cond: [{ $eq: ["$event_type", "click"] }, 1, 0] } },
        hovers: { $sum: { $cond: [{ $eq: ["$event_type", "hover"] }, 1, 0] } },
        touches: { $sum: { $cond: [{ $eq: ["$event_type", "touch"] }, 1, 0] } },
        video_plays: { $sum: { $cond: [{ $eq: ["$event_type", "video_play"] }, 1, 0] } },
        video_ends: { $sum: { $cond: [{ $eq: ["$event_type", "video_ended"] }, 1, 0] } },
        avg_hover_duration: { $avg: "$metadata.hover_duration" }
      }
    },
    {
      $addFields: {
        unique_session_count: { $size: "$unique_sessions" },
        ctr: {
          $cond: {
            if: { $gt: ["$total_interactions", 0] },
            then: { $multiply: [{ $divide: ["$clicks", "$total_interactions"] }, 100] },
            else: 0
          }
        },
        hover_to_click_rate: {
          $cond: {
            if: { $gt: ["$hovers", 0] },
            then: { $multiply: [{ $divide: ["$clicks", "$hovers"] }, 100] },
            else: 0
          }
        },
        video_completion_rate: {
          $cond: {
            if: { $gt: ["$video_plays", 0] },
            then: { $multiply: [{ $divide: ["$video_ends", "$video_plays"] }, 100] },
            else: 0
          }
        },
        video_play_rate: {
          $cond: {
            if: { $gt: [{ $add: ["$hovers", "$clicks"] }, 0] },
            then: { $multiply: [{ $divide: ["$video_plays", { $add: ["$hovers", "$clicks"] }] }, 100] },
            else: 0
          }
        }
      }
    }
  ];

  const data = await Analytics.aggregate(pipeline);
  return data[0] || {};

}

/*
* analytics.getEngagementQuality()
* calculate engagement quality metrics
*/

exports.getEngagementQuality = async function({ user_id, start_date, end_date }){

  const matchQuery = { user_id };
  
  if (start_date || end_date) {
    matchQuery.timestamp = {};
    if (start_date) matchQuery.timestamp.$gte = new Date(start_date);
    if (end_date) matchQuery.timestamp.$lte = new Date(end_date);
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: "$session_id",
        interaction_count: { $sum: 1 },
        unique_games: { $addToSet: "$game_id" },
        max_timestamp: { $max: "$timestamp" },  // ✅ Accumulate first
        min_timestamp: { $min: "$timestamp" }   // ✅ Accumulate first
      }
    },
    {
      $addFields: {  // ✅ Then calculate the difference
        session_duration_ms: {
          $subtract: ["$max_timestamp", "$min_timestamp"]
        }
      }
    },
    {
      $group: {
        _id: null,
        total_sessions: { $sum: 1 },
        single_interaction_sessions: { $sum: { $cond: [{ $eq: ["$interaction_count", 1] }, 1, 0] } },
        multi_interaction_sessions: { $sum: { $cond: [{ $gt: ["$interaction_count", 1] }, 1, 0] } },
        avg_interactions_per_session: { $avg: "$interaction_count" },
        avg_session_duration_ms: { $avg: "$session_duration_ms" },
        avg_games_per_session: { $avg: { $size: "$unique_games" } }
      }
    },
    {
      $addFields: {
        bounce_rate: {
          $cond: {
            if: { $gt: ["$total_sessions", 0] },
            then: { $multiply: [{ $divide: ["$single_interaction_sessions", "$total_sessions"] }, 100] },
            else: 0
          }
        },
        repeat_interaction_rate: {
          $cond: {
            if: { $gt: ["$total_sessions", 0] },
            then: { $multiply: [{ $divide: ["$multi_interaction_sessions", "$total_sessions"] }, 100] },
            else: 0
          }
        }
      }
    }
  ];

  const data = await Analytics.aggregate(pipeline);
  return data[0] || {};

}

/*
* analytics.getRealTimeMetrics()
* get real-time engagement metrics (last 5 and 15 minutes)
*/

exports.getRealTimeMetrics = async function({ user_id }){

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  const pipeline = [
    {
      $match: {
        user_id,
        timestamp: { $gte: fifteenMinutesAgo }
      }
    },
    {
      $addFields: {
        is_last_5_min: { $gte: ["$timestamp", fiveMinutesAgo] },
        is_last_15_min: { $gte: ["$timestamp", fifteenMinutesAgo] }
      }
    },
    {
      $group: {
        _id: null,
        events_last_5_min: { $sum: { $cond: ["$is_last_5_min", 1, 0] } },
        events_last_15_min: { $sum: { $cond: ["$is_last_15_min", 1, 0] } },
        active_sessions_5_min: { $addToSet: { $cond: ["$is_last_5_min", "$session_id", null] } },
        active_sessions_15_min: { $addToSet: { $cond: ["$is_last_15_min", "$session_id", null] } },
        trending_games_5_min: {
          $push: {
            $cond: ["$is_last_5_min", "$game_id", null]
          }
        }
      }
    },
    {
      $addFields: {
        active_sessions_5_min_count: {
          $size: {
            $filter: {
              input: "$active_sessions_5_min",
              cond: { $ne: ["$$this", null] }
            }
          }
        },
        active_sessions_15_min_count: {
          $size: {
            $filter: {
              input: "$active_sessions_15_min",
              cond: { $ne: ["$$this", null] }
            }
          }
        }
      }
    }
  ];

  const data = await Analytics.aggregate(pipeline);
  return data[0] || {};

}

/*
* analytics.getVideoMetrics()
* get video-specific engagement metrics
*/

exports.getVideoMetrics = async function({ user_id, start_date, end_date }){

  const matchQuery = { 
    user_id,
    event_type: { $in: ["video_play", "video_pause", "video_ended", "video_hover"] }
  };
  
  if (start_date || end_date) {
    matchQuery.timestamp = {};
    if (start_date) matchQuery.timestamp.$gte = new Date(start_date);
    if (end_date) matchQuery.timestamp.$lte = new Date(end_date);
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: "$event_type",
        count: { $sum: 1 },
        avg_duration: { $avg: "$metadata.video_duration" },
        avg_current_time: { $avg: "$metadata.video_current_time" }
      }
    },
    {
      $group: {
        _id: null,
        video_plays: { $sum: { $cond: [{ $eq: ["$_id", "video_play"] }, "$count", 0] } },
        video_pauses: { $sum: { $cond: [{ $eq: ["$_id", "video_pause"] }, "$count", 0] } },
        video_ends: { $sum: { $cond: [{ $eq: ["$_id", "video_ended"] }, "$count", 0] } },
        video_hovers: { $sum: { $cond: [{ $eq: ["$_id", "video_hover"] }, "$count", 0] } },
        avg_video_duration: { $avg: "$avg_duration" }
      }
    },
    {
      $addFields: {
        video_completion_rate: {
          $cond: {
            if: { $gt: ["$video_plays", 0] },
            then: { $multiply: [{ $divide: ["$video_ends", "$video_plays"] }, 100] },
            else: 0
          }
        },
        video_engagement_rate: {
          $cond: {
            if: { $gt: ["$video_plays", 0] },
            then: { $multiply: [{ $divide: [{ $add: ["$video_pauses", "$video_ends"] }, "$video_plays"] }, 100] },
            else: 0
          }
        }
      }
    }
  ];

  const data = await Analytics.aggregate(pipeline);
  return data[0] || {};

}

/*
* analytics.getTopGames()
* get top performing games with session counts
*/

exports.getTopGames = async function({ user_id, start_date, end_date, limit = 10 }){

  const matchQuery = { user_id };
  
  if (start_date || end_date) {
    matchQuery.timestamp = {};
    if (start_date) matchQuery.timestamp.$gte = new Date(start_date);
    if (end_date) matchQuery.timestamp.$lte = new Date(end_date);
  }

  const pipeline = [
    { $match: matchQuery },
    { 
      $group: { 
        _id: '$game_id',
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
    { $sort: { count: -1 } },
    { $limit: limit }
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
