const joi = require('joi');
const group = require('../model/group');
const utility = require('../helper/utility');

exports.create = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
    
    cmsGroupId: joi.string().required(),
    friendlyName: joi.string().required(),
    description: joi.string().required()

  }), req, res); 

  const groupData = await group.create({ data, user: req.user });
  return res.status(200).send({ message: res.__('group.create.success'), data: groupData });

}

exports.get = async function(req, res){

  const groups = await group.get({ id: req.params.id, user: req.user });
  res.status(200).send({ data: groups });

}

exports.update = async function(req, res){

  utility.assert(req.params.id, res.__('group.update.id_required'));

  // validate
  const data = utility.validate(joi.object({
    
    cmsGroupId: joi.string(),
    friendlyName: joi.string(),
    description: joi.string()

  }), req, res); 

  const groupData = await group.update({ id: req.params.id, user: req.user, data });
  
  if (!groupData) {
    return res.status(404).send({ message: res.__('group.update.not_found') });
  }

  return res.status(200).send({ message: res.__('group.update.success'), data: groupData });

}

exports.delete = async function(req, res){

  utility.assert(req.params.id, res.__('group.delete.id_required'));
  
  const result = await group.delete({ id: req.params.id, user: req.user });
  
  if (result.deletedCount === 0) {
    return res.status(404).send({ message: res.__('group.delete.not_found') });
  }

  res.status(200).send({ message: res.__('group.delete.success') });

}
