const joi = require('joi');
const axios = require('axios');
const openai = require('../model/openai');
const account = require('../model/account');
const utility = require('../helper/utility');
const { generateImageWithReplicate, generateVideoWithReplicate, generateImageAndVideoWithPrompt } = require('../services/asset-generation');

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

  console.log('req.body', req.body);
  console.log('req.user:', req.user);
  console.log('req.account:', req.account);

  // validate
  const data = utility.validate(joi.object({
    
    imageUrl: joi.string().required(),
    imagePrompt: joi.string().allow(''),
    videoPrompt: joi.string().allow(''),
    theme: joi.string().allow(''),
    assetType: joi.string().allow(''),
    gameId: joi.string().required(),
    generateImage: joi.boolean().required(),
    generateVideo: joi.boolean().required(),
    variant: joi.string().allow('').optional()

  }), req, res); 

  console.log('📥 Received prompts from frontend:', {
    imagePrompt: data.imagePrompt || '(empty)',
    videoPrompt: data.videoPrompt || '(empty)'
  });

  // Check if AI Agent server is configured - if yes, proxy to it
  // Set AI_AGENT_URL and AI_AGENT_API_KEY in environment to enable AI Agent proxy
  // If not set, falls back to legacy generateImageAndVideoWithPrompt service
  const aiAgentUrl = process.env.AI_AGENT_URL;
  const aiAgentApiKey = process.env.AI_AGENT_API_KEY;

  if (aiAgentUrl && aiAgentApiKey) {
    // Proxy to AI Agent server
    console.log('🚀 Proxying request to AI Agent server:', aiAgentUrl);
    
    try {
      const payload = {
        imageUrl: data.imageUrl,
        imagePrompt: data.imagePrompt,
        videoPrompt: data.videoPrompt,
        theme: data.theme,
        assetType: data.assetType,
        gameId: data.gameId,
        generateImage: data.generateImage,
        generateVideo: data.generateVideo,
        userId: req.user,      // From auth middleware
        accountId: req.account // From auth middleware
      };

      const aiResponse = await axios.post(`${aiAgentUrl}/api/process`, payload, {
        headers: {
          'X-API-Key': aiAgentApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes for long-running operations
      });

      console.log('✅ AI Agent response received');
      return res.status(200).send(aiResponse.data);
    } catch (error) {
      console.error('❌ AI Agent Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      // Return error response
      if (error.response) {
        return res.status(error.response.status || 500).send({
          error: error.response.data?.error || 'AI Agent Error',
          message: error.response.data?.message || error.message
        });
      } else if (error.request) {
        return res.status(500).send({
          error: 'AI Agent Connection Error',
          message: 'No response received from AI Agent service'
        });
      } else {
        return res.status(500).send({
          error: 'Internal Error',
          message: error.message
        });
      }
    }
  } else {
    // Fallback to old implementation if AI Agent not configured
    console.log('📦 Using legacy asset generation service');
    
    try {
      const imageAndVideoData = await generateImageAndVideoWithPrompt(
          data.imageUrl, 
          data.imagePrompt,
          data.videoPrompt,
          data.theme, 
          data.assetType,
          req.user,  
          req.account, 
          data.gameId,
          data.generateImage,
          data.generateVideo,
          data.variant
      );
      return res.status(200).send({ data: imageAndVideoData });
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  }

  // try {
  //   // Add userId to the payload before forwarding to n8n
  //   const payload = {
  //     ...req.body,
  //     userId: req.user
  //   };
    
  //   // Forward the enhanced payload to n8n
  //   const n8nResponse = await axios.post(
  //     process.env.N8N_PROCESS_AI_URL,
  //     payload,
  //     {
  //       auth: {
  //         username: process.env.N8N_USERNAME,
  //         password: process.env.N8N_PASSWORD
  //       },
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       timeout: 120000 // 2 minute timeout
  //     }
  //   );

  //   // Log the response to console
  //   console.log('N8N Response:', {
  //     status: n8nResponse.status,
  //     statusText: n8nResponse.statusText,
  //     data: n8nResponse.data,
  //     headers: n8nResponse.headers
  //   });

  //   // Return the n8n response to the client
  //   return res.status(n8nResponse.status).send(n8nResponse.data);

  // } catch (error) {
    
  //   // Log the error to console
  //   console.error('N8N Error:', {
  //     message: error.message,
  //     status: error.response?.status,
  //     statusText: error.response?.statusText,
  //     data: error.response?.data,
  //     config: {
  //       url: error.config?.url,
  //       method: error.config?.method,
  //       timeout: error.config?.timeout
  //     }
  //   });

  //   // Return error response
  //   if (error.response) {
  //     // n8n returned an error response
  //     return res.status(error.response.status).send({
  //       error: 'N8N Error',
  //       message: error.response.statusText,
  //       data: error.response.data
  //     });
  //   } else if (error.request) {
  //     // Request was made but no response received
  //     return res.status(500).send({
  //       error: 'N8N Connection Error',
  //       message: 'No response received from N8N service'
  //     });
  //   } else {
  //     // Something else happened
  //     return res.status(500).send({
  //       error: 'Internal Error',
  //       message: error.message
  //     });
  //   }
  // }
}