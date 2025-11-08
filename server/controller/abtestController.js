const joi = require('joi');
const abtest = require('../model/abtest');
const utility = require('../helper/utility');
const { emitABTestUpdate } = require('../realtime/socket');
const { emitABTestUpdates } = require('../services/realtime');

exports.create = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
    
    name: joi.string().required(),
    approvedBy: joi.string().allow(''),
    description: joi.string().required(),
    endTime: joi.string().required(),
    endDate: joi.string().required(),
    gameId: joi.string().required(),
    group: joi.string().required(),
    published: joi.boolean(),
    startDate: joi.string().required(),
    startTime: joi.string().required(),
    analyticsId: joi.string().allow(''),
    imageVariantA: joi.string().required(),
    videoVariantA: joi.string().required(),
    imageVariantB: joi.string().required(),
    videoVariantB: joi.string().required()

  }), req, res); 

  const abtestData = await abtest.create({ data, user: req.user });
  
  // Emit socket update for the new AB test
  try {
    await emitABTestUpdates(req.user, emitABTestUpdate);
  } catch (error) {
    console.error('Error emitting AB test update:', error);
    // Don't fail the request if socket emission fails
  }
  
  return res.status(200).send({ message: res.__('abtest.create.success'), data: abtestData });

}

exports.get = async function(req, res){

  const abtests = await abtest.get({ id: req.params.id, user: req.user });
  res.status(200).send({ data: abtests });

}

exports.update = async function(req, res){

  utility.assert(req.params.id, res.__('abtest.update.id_required'));

  // validate
  const data = utility.validate(joi.object({
    
    name: joi.string(),
    approvedBy: joi.string().allow(''),
    description: joi.string(),
    endTime: joi.string(),
    endDate: joi.string(),
    gameId: joi.string(),
    group: joi.string(),
    published: joi.boolean(),
    startDate: joi.string(),
    startTime: joi.string(),
    analyticsId: joi.string().allow(''),
    imageVariantA: joi.string(),
    videoVariantA: joi.string(),
    imageVariantB: joi.string(),
    videoVariantB: joi.string()

  }), req, res); 

  const abtestData = await abtest.update({ id: req.params.id, user: req.user, data });
  
  if (!abtestData) {
    return res.status(404).send({ message: res.__('abtest.update.not_found') });
  }

  // Emit socket update for the updated AB test
  try {
    await emitABTestUpdates(req.user, emitABTestUpdate);
  } catch (error) {
    console.error('Error emitting AB test update:', error);
    // Don't fail the request if socket emission fails
  }

  return res.status(200).send({ message: res.__('abtest.update.success'), data: abtestData });

}

exports.delete = async function(req, res){

  utility.assert(req.params.id, res.__('abtest.delete.id_required'));
  
  const result = await abtest.delete({ id: req.params.id, user: req.user });
  
  if (result.deletedCount === 0) {
    return res.status(404).send({ message: res.__('abtest.delete.not_found') });
  }

  // Emit socket update after deletion
  try {
    await emitABTestUpdates(req.user, emitABTestUpdate);
  } catch (error) {
    console.error('Error emitting AB test update:', error);
    // Don't fail the request if socket emission fails
  }

  res.status(200).send({ message: res.__('abtest.delete.success') });

}

