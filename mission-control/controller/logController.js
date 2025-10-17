const log = require('../model/log');
const utility = require('../helper/utility');

/*
* log.get()
* return log(s)
*/

exports.get = async function(req, res){

  const data = await log.get({ id: req.params.id, filter: req.query });  
  return res.status(200).send({ data: data });

}

/*
* log.delete()
* delete a log
*/

exports.delete = async function(req, res){

  const data = req.body;
  utility.validate(data, ['id']);

  await log.delete(data.id);
  return res.status(200).send({ message: `${Array.isArray(req.body.id) && req.body.id.length ? 'Logs' : 'Log'} deleted` });

}