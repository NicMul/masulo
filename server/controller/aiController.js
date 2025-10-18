const joi = require('joi');
const openai = require('../model/openai');
const account = require('../model/account');
const utility = require('../helper/utility');

exports.text = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
    
    prompt: joi.string().required(),

  }), req, res); 

  // check account has a plan
  const accountData = await account.get({ id: req.account });
  utility.assert(accountData.plan, res.__('account.plan_required'));

  console.log(res.__('ai.start'));
  const chatData = await openai.text({ prompt: data.prompt });

  console.log(i18n.__('ai.finish'));
  return res.status(200).send({ data: chatData });

}

exports.image = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
  
    prompt: joi.string().required(),
    size: joi.string().required(),

  }), req, res); 

  // check account has a plan
  const accountData = await account.get({ id: req.account });
  utility.assert(accountData.plan, res.__('account.plan_required'));

  console.log(res.__('ai.start'));
  const imageData = await openai.image({ prompt: data.prompt, size: data.size });  

  console.log(i18n.__('ai.finish'));
  return res.status(200).send({ data: imageData })

}

/*
* ai.process()
* Forward any payload to n8n with basic auth credentials
*/

exports.process = async function(req, res){

  const axios = require('axios');
  
  try {
    // Add userId to the payload before forwarding to n8n
    const payload = {
      ...req.body,
      userId: req.user
    };
    
    // Forward the enhanced payload to n8n
    const n8nResponse = await axios.post(
      process.env.N8N_PROCESS_AI_URL,
      payload,
      {
        auth: {
          username: process.env.N8N_USERNAME,
          password: process.env.N8N_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Log the response to console
    console.log('N8N Response:', {
      status: n8nResponse.status,
      statusText: n8nResponse.statusText,
      data: n8nResponse.data,
      headers: n8nResponse.headers
    });

    // Return the n8n response to the client
    return res.status(n8nResponse.status).send(n8nResponse.data);

  } catch (error) {
    
    // Log the error to console
    console.error('N8N Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      }
    });

    // Return error response
    if (error.response) {
      // n8n returned an error response
      return res.status(error.response.status).send({
        error: 'N8N Error',
        message: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      // Request was made but no response received
      return res.status(500).send({
        error: 'N8N Connection Error',
        message: 'No response received from N8N service'
      });
    } else {
      // Something else happened
      return res.status(500).send({
        error: 'Internal Error',
        message: error.message
      });
    }
  }
}