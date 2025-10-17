const joi = require('joi');
const game = require('../model/game');
const utility = require('../helper/utility');

exports.create = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
    
    cmsId: joi.string().required(),
    defaultImage: joi.string().required(),
    defaultVideo: joi.string().allow('', null),
    currentImage: joi.string().allow('', null),
    currentVideo: joi.string().allow('', null),
    themeImage: joi.string().allow('', null),
    themeVideo: joi.string().allow('', null),
    animate: joi.boolean().required(),
    hover: joi.boolean().required(),
    version: joi.number().required()

  }), req, res); 

  const gameData = await game.create({ data, user: req.user });
  return res.status(200).send({ message: res.__('game.create.success'), data: gameData });

}

exports.get = async function(req, res){

  const games = await game.get({ id: req.params.id, user: req.user });
  res.status(200).send({ data: games });

}

exports.update = async function(req, res){

  utility.assert(req.params.id, res.__('game.update.id_required'));

  // validate
  const data = utility.validate(joi.object({
    
    cmsId: joi.string(),
    defaultImage: joi.string(),
    defaultVideo: joi.string().allow('', null),
    currentImage: joi.string().allow('', null),
    currentVideo: joi.string().allow('', null),
    themeImage: joi.string().allow('', null),
    themeVideo: joi.string().allow('', null),
    animate: joi.boolean(),
    hover: joi.boolean(),
    version: joi.number()

  }), req, res); 

  const gameData = await game.update({ id: req.params.id, user: req.user, data });
  
  if (!gameData) {
    return res.status(404).send({ message: res.__('game.update.not_found') });
  }

  return res.status(200).send({ message: res.__('game.update.success'), data: gameData });

}

exports.delete = async function(req, res){

  utility.assert(req.params.id, res.__('game.delete.id_required'));
  
  const result = await game.delete({ id: req.params.id, user: req.user });
  
  if (result.deletedCount === 0) {
    return res.status(404).send({ message: res.__('game.delete.not_found') });
  }

  res.status(200).send({ message: res.__('game.delete.success') });

}
