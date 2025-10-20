const joi = require('joi');
const utility = require('../helper/utility');

exports.handle = async function(req, res){

  // validate the payload
  const data = utility.validate(joi.object({
  
    url: joi.string().uri().required(),
    action: joi.string().valid('start', 'stop').required()

  }), req, res);

  // log the payload to console
  console.log('Scraper endpoint called with payload:', data);

  // return the payload with status
  res.status(200).send({ 
    ...data,
    status: 'success'
  });

}
