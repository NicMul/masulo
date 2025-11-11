const joi = require('joi');
const analytics = require('../model/analytics');
const utility = require('../helper/utility');

exports.create = async function(req, res){

    // validate
    const data = utility.validate(joi.object({
      
    id: joi.string(),
    eventType: joi.string().required(),
    gameId: joi.string().required(),
    assetType: joi.string().required(),
    assetUrl: joi.string().required(),
    sessionId: joi.string().required(),
    userId: joi.string(),
    accountId: joi.string(),
    metadata: joi.object().default({}),
    timestamp: joi.string(),
    variantId: joi.string().optional()

    }), req, res); 
    
  const analyticsData = await analytics.create({ 
    data, 
    user: req.user, 
    account: req.account 
  });
  
  return res.status(200).send({ 
    message: 'Analytics event created successfully', 
    data: analyticsData 
  });

}

exports.createMany = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
    
    events: joi.array().items(
      joi.object({
        id: joi.string().optional(),
        eventType: joi.string().required(),
        gameId: joi.string().required(),
        assetType: joi.string().required(),
        assetUrl: joi.string().required(),
        sessionId: joi.string().required(),
        metadata: joi.object().default({}),
        timestamp: joi.string().optional(),
        variantId: joi.string().optional()
      })
    ).required()

  }), req, res); 

  const result = await analytics.createMany({ 
    events: data.events, 
    user: req.user, 
    account: req.account 
  });
  
  return res.status(200).send({ 
    message: `${result.insertedCount} analytics events created successfully`, 
    data: result 
  });

}

exports.get = async function(req, res){

  const filters = {
    id: req.params.id,
    gameId: req.query.gameId,
    userId: req.query.userId || req.user,
    accountId: req.query.accountId,
    eventType: req.query.eventType,
    assetType: req.query.assetType,
    sessionId: req.query.sessionId,
    startDate: req.query.start_date,
    endDate: req.query.end_date,
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0
  };

  const analyticsList = await analytics.get(filters);
  res.status(200).send({ data: analyticsList });

}

exports.getById = async function(req, res){

  utility.assert(req.params.id, 'ID is required');
  
  const analyticsData = await analytics.getById(req.params.id);
  
  if (!analyticsData) {
    return res.status(404).send({ 
      message: 'Analytics event not found' 
    });
  }
  
  res.status(200).send({ data: analyticsData });

}

exports.update = async function(req, res){

  utility.assert(req.params.id, 'ID is required');

  // validate
  const data = utility.validate(joi.object({
    
    eventType: joi.string(),
    gameId: joi.string(),
    assetType: joi.string(),
    assetUrl: joi.string(),
    sessionId: joi.string(),
    metadata: joi.object(),
    timestamp: joi.string(),
    variantId: joi.string()

  }), req, res); 

  const analyticsData = await analytics.update({ id: req.params.id, data });
  
  if (!analyticsData) {
    return res.status(404).send({ 
      message: 'Analytics event not found' 
    });
  }

  return res.status(200).send({ 
    message: 'Analytics event updated successfully', 
    data: analyticsData 
  });

}

exports.delete = async function(req, res){

  utility.assert(req.params.id, 'ID is required');
  
  const result = await analytics.delete({ id: req.params.id });
  
  if (result.deletedCount === 0) {
    return res.status(404).send({ 
      message: 'Analytics event not found' 
    });
  }

  res.status(200).send({ 
    message: 'Analytics event deleted successfully' 
  });

}

exports.deleteMany = async function(req, res){

  const filters = {
    gameId: req.query.gameId,
    userId: req.query.userId || req.user,
    accountId: req.query.accountId
  };

  const result = await analytics.deleteMany(filters);

  res.status(200).send({ 
    message: `${result.deletedCount} analytics events deleted successfully`,
    count: result.deletedCount 
  });

}

exports.aggregate = async function(req, res){

  // validate pipeline
  const data = utility.validate(joi.object({
    pipeline: joi.array().required()
  }), req, res);

  const results = await analytics.aggregate(data.pipeline);

  res.status(200).send({ data: results });

}

exports.getDashboardData = async function(req, res){
  
  try {
    // Build base match filter
    const matchFilter = {};
    
    // User filtering (always required)
    if (req.user) {
      matchFilter.userId = req.user;
    }
    
    // Account filtering - use $or to match either the accountId OR userId
    // This handles cases where accountId was set to userId during event creation
    if (req.account && req.user) {
      matchFilter.$or = [
        { accountId: req.account },
        { accountId: req.user } // Fallback: some events may have accountId = userId
      ];
    } else if (req.account) {
      matchFilter.accountId = req.account;
    }
    
    // Date range filtering
    if (req.query.start_date || req.query.end_date) {
      matchFilter.timestamp = {};
      if (req.query.start_date) {
        matchFilter.timestamp.$gte = req.query.start_date;
      }
      if (req.query.end_date) {
        matchFilter.timestamp.$lte = req.query.end_date;
      }
    }
    
    // Execute all aggregations in parallel for better performance
    const [
      eventTypes, 
      assetTypes, 
      topGames, 
      recentEvents,
      assetPerformance,
      conversionMetrics,
      engagementQuality,
      realTimeMetrics,
      videoMetrics
    ] = await Promise.all([
      getEventTypes(matchFilter),
      getAssetTypes(matchFilter),
      getTopGames(matchFilter),
      getRecentEvents(matchFilter),
      getAssetPerformance(matchFilter),
      getConversionMetrics(matchFilter),
      getEngagementQuality(matchFilter),
      getRealTimeMetrics(req.account, req.user),
      getVideoMetrics(matchFilter)
    ]);
    
    return res.status(200).send({
      data: {
        eventTypes,
        assetTypes,
        topGames,
        recentEvents,
        assetPerformance,
        conversionMetrics,
        engagementQuality,
        realTimeMetrics,
        videoMetrics
      }
    });
    
  } catch (error) {
    console.error('[Analytics] Dashboard data error:', error);
    return res.status(500).send({
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
}

// Helper function: Get event types with counts
async function getEventTypes(matchFilter) {
  const pipeline = [
    { $match: matchFilter },
    {
      $group: {
        _id: { eventType: '$eventType' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ];
  
  return await analytics.aggregate(pipeline);
}

// Helper function: Get asset types with counts
async function getAssetTypes(matchFilter) {
  const pipeline = [
    { $match: matchFilter },
    {
      $group: {
        _id: { assetType: '$assetType' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ];
  
  return await analytics.aggregate(pipeline);
}

// Helper function: Get top games with friendlyName
async function getTopGames(matchFilter) {
  const pipeline = [
    { $match: matchFilter },
    {
      $group: {
        _id: '$gameId',
        count: { $sum: 1 },
        unique_session_count: { $addToSet: '$sessionId' },
        last_seen: { $max: '$timestamp' }
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        unique_session_count: { $size: '$unique_session_count' },
        last_seen: 1
      }
    },
    {
      $lookup: {
        from: 'game',
        localField: '_id',
        foreignField: 'id',
        as: 'gameInfo'
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        unique_session_count: 1,
        last_seen: 1,
        friendlyName: {
          $ifNull: [{ $arrayElemAt: ['$gameInfo.friendlyName', 0] }, null]
        }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ];
  
  return await analytics.aggregate(pipeline);
}

// Helper function: Get recent events with friendlyName
async function getRecentEvents(matchFilter) {
  const pipeline = [
    { $match: matchFilter },
    { $sort: { timestamp: -1 } },
    { $limit: 15 },
    {
      $lookup: {
        from: 'game',
        localField: 'gameId',
        foreignField: 'id',
        as: 'gameInfo'
      }
    },
    {
      $project: {
        eventType: 1,
        assetType: 1,
        gameId: 1,
        timestamp: 1,
        sessionId: 1,
        friendlyName: {
          $ifNull: [{ $arrayElemAt: ['$gameInfo.friendlyName', 0] }, null]
        }
      }
    }
  ];
  
  return await analytics.aggregate(pipeline);
}

// Helper function: Get asset performance metrics
async function getAssetPerformance(matchFilter) {
  const pipeline = [
    { $match: matchFilter },
    {
      $group: {
        _id: '$assetType',
        total_interactions: { $sum: 1 },
        impressions: {
          $sum: {
            $cond: [
              { $in: ['$eventType', ['impression', 'image_impression']] },
              1,
              0
            ]
          }
        },
        clicks: {
          $sum: {
            $cond: [
              { $in: ['$eventType', ['video_click', 'button_click']] },
              1,
              0
            ]
          }
        },
        video_plays: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'video_play'] }, 1, 0]
          }
        },
        video_completes: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'video_complete'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        total_interactions: 1,
        ctr: {
          $cond: [
            { $gt: ['$impressions', 0] },
            {
              $multiply: [
                {
                  $divide: ['$clicks', '$impressions']
                },
                100
              ]
            },
            0
          ]
        },
        video_completion_rate: {
          $cond: [
            { $gt: ['$video_plays', 0] },
            {
              $multiply: [
                {
                  $divide: ['$video_completes', '$video_plays']
                },
                100
              ]
            },
            0
          ]
        }
      }
    }
  ];
  
  return await analytics.aggregate(pipeline);
}

// Helper function: Get conversion metrics
async function getConversionMetrics(matchFilter) {
  // Calculate hover duration from video_play to video_pause pairs
  // Get all play and pause events, sorted by timestamp
  const playPauseEvents = await analytics.aggregate([
    { $match: { ...matchFilter, eventType: { $in: ['video_play', 'video_pause'] } } },
    { $sort: { sessionId: 1, gameId: 1, assetUrl: 1, timestamp: 1 } },
    { $project: { eventType: 1, timestamp: 1, sessionId: 1, gameId: 1, assetUrl: 1 } }
  ]);
  
  // Pair play events with their next pause event and calculate durations
  const durations = [];
  const playStack = new Map(); // key: sessionId-gameId-assetUrl, value: timestamp
  
  for (const event of playPauseEvents) {
    const key = `${event.sessionId}-${event.gameId}-${event.assetUrl}`;
    
    if (event.eventType === 'video_play') {
      playStack.set(key, event.timestamp);
    } else if (event.eventType === 'video_pause' && playStack.has(key)) {
      const playTimestamp = playStack.get(key);
      playStack.delete(key);
      
      const playTime = new Date(playTimestamp).getTime();
      const pauseTime = new Date(event.timestamp).getTime();
      const duration = pauseTime - playTime;
      
      if (duration > 0) {
        durations.push(duration);
      }
    }
  }
  
  // Calculate average
  const avgHoverDurationMs = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;
  
  // Now get the main conversion metrics
  const pipeline = [
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        impressions: {
          $sum: {
            $cond: [
              { $in: ['$eventType', ['impression', 'image_impression']] },
              1,
              0
            ]
          }
        },
        clicks: {
          $sum: {
            $cond: [
              { $in: ['$eventType', ['video_click', 'button_click']] },
              1,
              0
            ]
          }
        },
        hover_starts: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'video_play'] }, 1, 0]
          }
        },
        video_plays: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'video_play'] }, 1, 0]
          }
        },
        video_pauses: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'video_pause'] }, 1, 0]
          }
        },
        video_completes: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'video_complete'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        ctr: {
          $cond: [
            { $gt: ['$impressions', 0] },
            {
              $multiply: [
                {
                  $divide: ['$clicks', '$impressions']
                },
                100
              ]
            },
            0
          ]
        },
        hover_to_click_rate: {
          $cond: [
            { $gt: ['$hover_starts', 0] },
            {
              $multiply: [
                {
                  $divide: ['$clicks', '$hover_starts']
                },
                100
              ]
            },
            0
          ]
        },
        video_completion_rate: {
          $cond: [
            { $gt: ['$video_plays', 0] },
            {
              $multiply: [
                {
                  $divide: ['$video_completes', '$video_plays']
                },
                100
              ]
            },
            0
          ]
        }
      }
    }
  ];
  
  const result = await analytics.aggregate(pipeline);
  
  // Merge the calculated avg_hover_duration into the result
  const metrics = result[0] || { 
    ctr: 0, 
    hover_to_click_rate: 0, 
    video_completion_rate: 0
  };
  
  metrics.avg_hover_duration = avgHoverDurationMs;
  
  return metrics;
}

// Helper function: Get engagement quality metrics
async function getEngagementQuality(matchFilter) {
  const pipeline = [
    { $match: matchFilter },
    {
      $group: {
        _id: '$sessionId',
        event_count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total_sessions: { $sum: 1 },
        total_events: { $sum: '$event_count' },
        single_event_sessions: {
          $sum: {
            $cond: [{ $eq: ['$event_count', 1] }, 1, 0]
          }
        },
        multi_event_sessions: {
          $sum: {
            $cond: [{ $gt: ['$event_count', 1] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        avg_interactions_per_session: {
          $cond: [
            { $gt: ['$total_sessions', 0] },
            {
              $divide: ['$total_events', '$total_sessions']
            },
            0
          ]
        },
        bounce_rate: {
          $cond: [
            { $gt: ['$total_sessions', 0] },
            {
              $multiply: [
                {
                  $divide: ['$single_event_sessions', '$total_sessions']
                },
                100
              ]
            },
            0
          ]
        },
        repeat_interaction_rate: {
          $cond: [
            { $gt: ['$total_sessions', 0] },
            {
              $multiply: [
                {
                  $divide: ['$multi_event_sessions', '$total_sessions']
                },
                100
              ]
            },
            0
          ]
        }
      }
    }
  ];
  
  const result = await analytics.aggregate(pipeline);
  return result[0] || {
    avg_interactions_per_session: 0,
    bounce_rate: 0,
    repeat_interaction_rate: 0
  };
}

// Helper function: Get real-time metrics
async function getRealTimeMetrics(accountId, userId) {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  
  // Build base filters
  const baseFilter5Min = {
    timestamp: { $gte: fiveMinutesAgo }
  };
  const baseFilter15Min = {
    timestamp: { $gte: fifteenMinutesAgo }
  };
  
  // User filtering (always required)
  if (userId) {
    baseFilter5Min.userId = userId;
    baseFilter15Min.userId = userId;
  }
  
  // Account filtering - use $or to match either the accountId OR userId
  if (accountId && userId) {
    baseFilter5Min.$or = [
      { accountId: accountId },
      { accountId: userId } // Fallback: some events may have accountId = userId
    ];
    baseFilter15Min.$or = [
      { accountId: accountId },
      { accountId: userId }
    ];
  } else if (accountId) {
    baseFilter5Min.accountId = accountId;
    baseFilter15Min.accountId = accountId;
  }
  
  const [metrics5Min, metrics15Min] = await Promise.all([
    analytics.aggregate([
      { $match: baseFilter5Min },
      {
        $group: {
          _id: null,
          active_sessions_5_min_count: { $addToSet: '$sessionId' },
          events_last_5_min: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          active_sessions_5_min_count: { $size: '$active_sessions_5_min_count' },
          events_last_5_min: 1
        }
      }
    ]),
    analytics.aggregate([
      { $match: baseFilter15Min },
      {
        $group: {
          _id: null,
          active_sessions_15_min_count: { $addToSet: '$sessionId' },
          events_last_15_min: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          active_sessions_15_min_count: { $size: '$active_sessions_15_min_count' },
          events_last_15_min: 1
        }
      }
    ])
  ]);
  
  return {
    active_sessions_5_min_count: metrics5Min[0]?.active_sessions_5_min_count || 0,
    active_sessions_15_min_count: metrics15Min[0]?.active_sessions_15_min_count || 0,
    events_last_5_min: metrics5Min[0]?.events_last_5_min || 0,
    events_last_15_min: metrics15Min[0]?.events_last_15_min || 0
  };
}

// Helper function: Get video metrics
async function getVideoMetrics(matchFilter) {
  const pipeline = [
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        video_plays: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'video_play'] }, 1, 0]
          }
        },
        video_pauses: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'video_pause'] }, 1, 0]
          }
        },
        video_ends: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'video_complete'] }, 1, 0]
          }
        },
        video_hovers: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'video_play'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        video_plays: 1,
        video_pauses: 1,
        video_ends: 1,
        video_hovers: 1
      }
    }
  ];
  
  const result = await analytics.aggregate(pipeline);
  return result[0] || {
    video_plays: 0,
    video_pauses: 0,
    video_ends: 0,
    video_hovers: 0
  };
}
