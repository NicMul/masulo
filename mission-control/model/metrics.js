const utility = require('../helper/utility');
const chart = require('../helper/chart');
const Account = require('./account').schema;

/*
* metrics.accounts()
* return the total number of registered accounts
*/

exports.accounts = async function(filter){

  return await Account.countDocuments(filter);

}

/*
* metrics.growth()
* create a chart of user signups each month
*/

exports.growth = async function(){

  let chartData = []

  const data = await Account.aggregate([{
    $group: {

      _id: { $month: '$date_created' },
      total: { $sum: 1 }

    }
  }]);

  if (data?.length){
    data.forEach(month => {
      chartData.push({

        label: utility.convertToMonthName(month._id),
        value: month.total

      })
    });
  }

  return chart.create(chartData, 'Signups');

}
