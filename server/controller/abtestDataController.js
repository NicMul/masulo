const joi = require('joi');
const abtestData = require('../model/abtest-data');
const utility = require('../helper/utility');

exports.create = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
    
    id: joi.string(),
    gameId: joi.string().required(),
    start: joi.string().required(),
    end: joi.string().required(),
    userId: joi.string(),
    accountId: joi.string(),
    eventType: joi.string().required(),
    variant: joi.string().valid('variantA', 'variantB').required(),
    timestamp: joi.string(),
    distributionWeight: joi.number().required(),
    device: joi.string().valid('mobile', 'desktop').required(),
    data: joi.object().default({})

  }), req, res); 

  const testData = await abtestData.create({ 
    data, 
    user: req.user, 
    account: req.account 
  });
  
  return res.status(200).send({ 
    message: res.__('abtestdata.create.success') || 'AB test data created successfully', 
    data: testData 
  });

}

exports.get = async function(req, res){

  const filters = {
    id: req.params.id,
    gameId: req.query.gameId,
    userId: req.query.userId,
    accountId: req.query.accountId,
    variant: req.query.variant,
    eventType: req.query.eventType,
    device: req.query.device
  };

  const testDataList = await abtestData.get(filters);
  res.status(200).send({ data: testDataList });

}

exports.getById = async function(req, res){

  utility.assert(req.params.id, res.__('abtestdata.get.id_required') || 'ID is required');
  
  const testData = await abtestData.getById(req.params.id);
  
  if (!testData) {
    return res.status(404).send({ 
      message: res.__('abtestdata.get.not_found') || 'AB test data not found' 
    });
  }
  
  res.status(200).send({ data: testData });

}

exports.update = async function(req, res){

  utility.assert(req.params.id, res.__('abtestdata.update.id_required') || 'ID is required');

  // validate
  const data = utility.validate(joi.object({
    
    gameId: joi.string(),
    start: joi.string(),
    end: joi.string(),
    userId: joi.string(),
    accountId: joi.string(),
    eventType: joi.string(),
    variant: joi.string().valid('variantA', 'variantB'),
    timestamp: joi.string(),
    distributionWeight: joi.number(),
    device: joi.string().valid('mobile', 'desktop'),
    data: joi.object()

  }), req, res); 

  const testData = await abtestData.update({ id: req.params.id, data });
  
  if (!testData) {
    return res.status(404).send({ 
      message: res.__('abtestdata.update.not_found') || 'AB test data not found' 
    });
  }

  return res.status(200).send({ 
    message: res.__('abtestdata.update.success') || 'AB test data updated successfully', 
    data: testData 
  });

}

exports.delete = async function(req, res){

  utility.assert(req.params.id, res.__('abtestdata.delete.id_required') || 'ID is required');
  
  const result = await abtestData.delete({ id: req.params.id });
  
  if (result.deletedCount === 0) {
    return res.status(404).send({ 
      message: res.__('abtestdata.delete.not_found') || 'AB test data not found' 
    });
  }

  res.status(200).send({ 
    message: res.__('abtestdata.delete.success') || 'AB test data deleted successfully' 
  });

}

exports.deleteMany = async function(req, res){

  const filters = {
    gameId: req.query.gameId,
    userId: req.query.userId,
    accountId: req.query.accountId
  };

  const result = await abtestData.deleteMany(filters);

  res.status(200).send({ 
    message: res.__('abtestdata.deleteMany.success') || `${result.deletedCount} AB test data entries deleted successfully`,
    count: result.deletedCount 
  });

}

exports.aggregate = async function(req, res){

  // validate pipeline
  const data = utility.validate(joi.object({
    pipeline: joi.array().required()
  }), req, res);

  const results = await abtestData.aggregate(data.pipeline);

  res.status(200).send({ data: results });

}

