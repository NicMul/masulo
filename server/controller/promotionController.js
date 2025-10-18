const joi = require('joi');
const promotion = require('../model/promotion');
const utility = require('../helper/utility');

exports.create = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
    
    name: joi.string().required(),
    description: joi.string().required(),
    startDate: joi.date().required(),
    endDate: joi.date().required(),
    games: joi.array().items(joi.string()).required(),
    approvedBy: joi.string().required()

  }), req, res); 

  // validate that endDate is after startDate
  if (data.endDate <= data.startDate) {
    return res.status(400).send({ message: res.__('promotion.create.end_date_after_start') });
  }

  const promotionData = await promotion.create({ data, user: req.user });
  return res.status(200).send({ message: res.__('promotion.create.success'), data: promotionData });

}

exports.get = async function(req, res){

  const promotions = await promotion.get({ id: req.params.id, user: req.user });
  res.status(200).send({ data: promotions });

}

exports.update = async function(req, res){

  utility.assert(req.params.id, res.__('promotion.update.id_required'));

  // validate
  const data = utility.validate(joi.object({
    
    name: joi.string(),
    description: joi.string(),
    startDate: joi.date(),
    endDate: joi.date(),
    games: joi.array().items(joi.string()),
    approvedBy: joi.string()

  }), req, res); 

  // validate that endDate is after startDate if both are provided
  if (data.endDate && data.startDate && data.endDate <= data.startDate) {
    return res.status(400).send({ message: res.__('promotion.update.end_date_after_start') });
  }

  const promotionData = await promotion.update({ id: req.params.id, user: req.user, data });
  
  if (!promotionData) {
    return res.status(404).send({ message: res.__('promotion.update.not_found') });
  }

  return res.status(200).send({ message: res.__('promotion.update.success'), data: promotionData });

}

exports.delete = async function(req, res){

  utility.assert(req.params.id, res.__('promotion.delete.id_required'));
  
  const result = await promotion.delete({ id: req.params.id, user: req.user });
  
  if (result.deletedCount === 0) {
    return res.status(404).send({ message: res.__('promotion.delete.not_found') });
  }

  res.status(200).send({ message: res.__('promotion.delete.success') });

}
