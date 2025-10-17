const { v4: uuidv4 } = require('uuid');
const db = require('./knex')();
const bcrypt = require('bcrypt');

/*
* user.create()
* create a new user 
*/

exports.create = async function({ user, account }){
  
  const data = {

    id: uuidv4(),
    name: user.name,
    email: user.email,
    facebook_id: user.facebook_id,
    twitter_id: user.twitter_id,
    default_account: account,
    verified: user.verified

  }

  // encrypt password
  if (user.password){
  
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(user.password, salt);

  }

  // create the user
  await db('user').insert(data);

  if (data.password){

    delete data.password;
    data.has_password = true;

  }

  data.account_id = account;
  return data;

}

/*
* user.get()
* list all the users of your app
*/

exports.get = async function({ id, email } = {}){

  const data = await db('user')
  .select('id', 'avatar', 'name', 'email', 'default_account', 
    'date_created', 'last_active', 'support_enabled')
  .join('account_users', 'account_users.user_id', 'user.id')
  .groupBy('id')
  .modify(q => {

    id && q.where('id', id);
    !id && q.whereNot('permission', 'master');
    email && q.where('email', email);

  });

  if (data?.length){
    data.forEach(u => {

      u.avatar = u.avatar ? 
        `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${u.avatar}` : null

    })
  }

  return data;

}

exports.account = {};

/*
* user.account.add()
* assign a user to an account
*/

exports.account.add = async function({ id, account, permission }){

  return await db('account_users')
  .insert({ user_id: id, account_id: account, permission: permission });

}

/*
* user.update()
* update a user
*/

exports.update = async function({ id, data }){

  await db('user').update(data).where({ id: id });
  return data;

}

/*
* user.delete()
* delete a user
*/


exports.delete = async function(id){

  return await db('user').del().where('id', id);

}