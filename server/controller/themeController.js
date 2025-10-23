const joi = require('joi');
const theme = require('../model/theme');
const utility = require('../helper/utility');

exports.create = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
    
    cmsThemeId: joi.string().required(),
    friendlyName: joi.string().required(),
    description: joi.string().required()

  }), req, res); 

  const themeData = await theme.create({ data, user: req.user });
  return res.status(200).send({ message: res.__('theme.create.success'), data: themeData });

}

exports.get = async function(req, res){

  const themes = await theme.get({ id: req.params.id, user: req.user });
  res.status(200).send({ data: themes });

}

exports.update = async function(req, res){

  utility.assert(req.params.id, res.__('theme.update.id_required'));

  // validate
  const data = utility.validate(joi.object({
    
    cmsThemeId: joi.string(),
    friendlyName: joi.string(),
    description: joi.string()

  }), req, res); 

  const themeData = await theme.update({ id: req.params.id, user: req.user, data });
  
  if (!themeData) {
    return res.status(404).send({ message: res.__('theme.update.not_found') });
  }

  return res.status(200).send({ message: res.__('theme.update.success'), data: themeData });

}

exports.delete = async function(req, res){

  utility.assert(req.params.id, res.__('theme.delete.id_required'));
  
  const result = await theme.delete({ id: req.params.id, user: req.user });
  
  if (result.deletedCount === 0) {
    return res.status(404).send({ message: res.__('theme.delete.not_found') });
  }

  res.status(200).send({ message: res.__('theme.delete.success') });

}
