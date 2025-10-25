const joi = require('joi');
const analytics = require('../model/analytics');
const utility = require('../helper/utility');

exports.create = async function(req, res){

  if (process.env.STORE_EVENT_LOGS === 'true'){

    // validate
    const data = utility.validate(joi.object({
      
      event_type: joi.string().required(),
      game_id: joi.string().required(),
      asset_type: joi.string().required(),
      asset_url: joi.string().required(),
      session_id: joi.string().required(),
      metadata: joi.object(),
      variant_id: joi.string().optional()

    }), req, res); 
    
    const analyticsData = await analytics.create({ data, user: req.user, account: req.account });
    return res.status(200).send({ message: 'Analytics event created successfully', data: analyticsData });

  }

  res.status(200).send();

}

exports.get = async function(req, res){

  const query = {
    game_id: req.query.game_id,
    asset_type: req.query.asset_type,
    event_type: req.query.event_type,
    user_id: req.user,
    session_id: req.query.session_id,
    start_date: req.query.start_date,
    end_date: req.query.end_date,
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0
  };

  const list = await analytics.get(query);
  res.status(200).send({ data: list });

}

exports.aggregate = async function(req, res){

  const query = {
    game_id: req.query.game_id,
    asset_type: req.query.asset_type,
    event_type: req.query.event_type,
    user_id: req.user,
    start_date: req.query.start_date,
    end_date: req.query.end_date,
    groupBy: req.query.groupBy ? req.query.groupBy.split(',') : ['asset_type', 'event_type']
  };

  const aggregatedData = await analytics.aggregate(query);
  res.status(200).send({ data: aggregatedData });

}

exports.getByGame = async function(req, res){

  utility.assert(req.params.game_id, 'Game ID is required');
  
  const query = {
    game_id: req.params.game_id,
    user_id: req.user,
    start_date: req.query.start_date,
    end_date: req.query.end_date
  };

  const gameAnalytics = await analytics.getByGame(query.game_id, query.user_id, query.start_date, query.end_date);
  res.status(200).send({ data: gameAnalytics });

}

exports.getDashboardData = async function(req, res){
  try {
    const { start_date, end_date } = req.query;
    
    // Run all aggregations in parallel for better performance
    const [stats, eventTypes, assetTypes, topGames, recentEvents] = await Promise.all([
      analytics.aggregate({ 
        groupBy: ['event_type'], 
        start_date, 
        end_date,
        user_id: req.user
      }),
      analytics.aggregate({ 
        groupBy: ['event_type', 'date'], 
        start_date, 
        end_date,
        user_id: req.user
      }),
      analytics.aggregate({ 
        groupBy: ['asset_type'], 
        start_date, 
        end_date,
        user_id: req.user
      }),
      analytics.aggregate({ 
        groupBy: ['game_id'], 
        start_date, 
        end_date,
        limit: 10,
        user_id: req.user
      }),
      analytics.get({ 
        limit: 10, 
        sort: '-timestamp',
        start_date,
        end_date,
        user_id: req.user
      })
    ]);
    
    return res.status(200).send({ data: {
        stats: stats || [],
        eventTypes: eventTypes || [],
        assetTypes: assetTypes || [],
        topGames: topGames || [],
        recentEvents: recentEvents || []
      }});
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).send({ error: 'Failed to fetch dashboard data' });
  }
};

exports.delete = async function(req, res){

  utility.assert(req.params.id, 'Analytics ID is required');
  
  await analytics.delete(req.params.id);
  res.status(200).send({ message: 'Analytics event deleted successfully' });

}
