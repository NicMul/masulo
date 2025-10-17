const db = require('./knex')();
const utility = require('../helper/utility');
const chart = require('../helper/chart');

/*
* metrics.accounts()
* return the total number of registered accounts
*/

exports.accounts = async function(filter){

  const data = await db('account').count('id as total')
  .leftJoin('account_users', 'account_users.account_id', 'account.id')
  .where(filter || {})
  .whereNot('permission', 'master')
  return data[0].total;

}

/*
* metrics.growth()
* create a chart of user signups each month
*/

exports.growth = async function(){

  const data = await db('account')
  .select(db.raw('EXTRACT(month FROM account.date_created) as label'))
  .count('account.id as value')
  .groupBy(db.raw('EXTRACT(month FROM account.date_created)'));

  // get the months and count the totals
  data.length && data.forEach(month => {

    month.label = utility.convertToMonthName(month.label);

  });

  // create the chart
  return chart.create(data, 'Signups');

}
