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
