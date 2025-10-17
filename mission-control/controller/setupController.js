const setup = require('../model/setup');
const account = require('../model/account');
const user = require('../model/user');
const utility = require('../helper/utility');
const backendSettings = require('../config/default');
const frontendSettings = require('../client/src/settings.json');

/*
* setup.database()
* get the database settings
*/

exports.database = async function(req, res){
  
  return res.status(200).send({ data: {

    client: process.env.DB_CLIENT,
    connection: {

      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME

    }
  }});
}

/*
* setup.database.update()
* configure the database settings
*/

exports.database.update =  async function(req, res){

  let settings = { client: req.body.client }
  delete req.body.client;
  settings.connection = req.body;

  if (settings.client === 'mongo'){

    await setup.database.mongo(settings.connection.host);
    await setup.package({ remove: ['mysql', 'knex'] }); // clean package.json

  }
  else {

    settings.connection.ssl = { rejectUnauthorized: false };
    await setup.database.sql(settings);
    await setup.package({ remove: ['mongodb', 'mongoose', 'express-mongo-sanitize'] }); // clean package.json

  }

  await setup.env({ key: 'DB_CLIENT', value: settings.client });
  await setup.env({ key: 'DB_USER', value: settings.connection.user });
  await setup.env({ key: 'DB_PASSWORD', value: settings.connection.password });
  await setup.env({ key: 'DB_HOST', value: settings.connection.host });
  await setup.env({ key: 'DB_NAME', value: settings.connection.database });
  await setup.env({ key: 'DB_PORT', value: settings.connection.port });

  console.log('✅ Connected to database');
  return res.status(200).send({ message: 'Connected to database' });

};

/*
* setup.stripe()
* get the stripe settings
*/

exports.stripe = async function(req, res){

  let settings = backendSettings.stripe;
  settings.publishableAPIKey = frontendSettings.development.stripe.publishableAPIKey;
  return res.status(200).send({ data: settings });

};

/*
* setup.stripe.update()
* save stripe settings
*/

exports.stripe.update = async function(req, res){

  const data = req.body;
  utility.validate(data, ['test_sk']);

  // save keys
  await setup.env({ key: 'STRIPE_SECRET_API_KEY', value: data.test_sk || data.live_sk }); 
  
  // save plans
  const testconfig = await setup.stripe({ secretAPIKey: data.test_sk, freePlan: data.freePlan });  
  await setup.settings({ key: 'stripe', value: testconfig, mode: 'development' }); // save plans

  if (data.live_sk){

    const prodconfig = await setup.stripe({ secretAPIKey: data.live_sk, freePlan: data.freePlan });  
    await setup.settings({ key: 'stripe', value: prodconfig, mode: 'production' }); // save plans

  }

  console.log('✅ Stripe settings saved');
  return res.status(200).send({ message: 'Stripe settings saved' });

};

/*
* setup.url()
* get the main app url
*/

exports.url = async function(req, res){
  
  res.status(200).send({ data: {

    remote_server: frontendSettings.development.remote_server,
    remote_client: frontendSettings.development.remote_client
    
  }});
}

/*
* setup.url.update()
* update the main app url
*/

exports.url.update = async function(req, res){

  // save server url in client 
  await setup.client({ remote_server: req.body.remote_server }, 'development');
  await setup.client({ remote_server: req.body.remote_server}, 'production');
  await setup.client({ remote_client: req.body.remote_client }, 'development');
  await setup.client({ remote_client: req.body.remote_client }, 'production');
  res.status(200).send({ message: 'URL saved' });
  
}

/*
* setup.account()
* create the master account
*/

exports.account = async function(req, res){

  // check if account exists
  const data = req.body;
  utility.validate(data, ['email', 'password']);

  let userData = await user.get({ email: data.email });
  if (userData.length) throw { message: 'You have already registered an account with this email' };

  // create the account and user
  const accountData = await account.create({ plan: 'master', name: 'Master' });

  userData = await user.create({ user: { 
    
    name: 'Master', 
    email: data.email, 
    password: data.password,
    verified: true,
  
  }, account: accountData.id });

  await user.account.add({ id: userData.id, account: accountData.id, permission: 'master' });

  console.log('✅ Master account created');
  return res.status(200).send({ message: 'Master account created' });

};

/*
* setup.token()
* save the token secret
*/

exports.token = async function(req, res){

  utility.validate(req.body, ['token_secret']);
  await setup.env({ key: 'TOKEN_SECRET', value: req.body.token_secret });
  return res.status(200).send({ message: 'Token secret saved' }); 

}