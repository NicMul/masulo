const { v4: uuidv4 } = require('uuid');
const db = require('./knex')();

/*
* account.create()
* create a new account
*/

exports.create = async function(account){

  const data = {

    id: uuidv4(),
    active: true,
    plan: account.plan || 'free',
    name: account.name || 'My Account'

  }

  await db('account').insert(data);
  return data;

}

/*
* account.get()
* return the accounts
*/

exports.get = async function() {

  return await db('account')
  .select('account.id', 'user.email as email',
    db.raw("COALESCE(account.plan, 'Not on plan') as plan"), 'active', 'account.date_created')
  .join('account_users', 'account_users.account_id', 'account.id')
  .join('user', 'account_users.user_id', 'user.id')
  .where('account_users.permission', 'owner')
  .groupBy('account.id', 'user.email', 'account.active', 'account.date_created');

};