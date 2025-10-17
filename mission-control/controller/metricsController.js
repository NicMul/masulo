const metrics = require('../model/metrics');

/*
* metrics.growth()
* returns a chart of signups to your app over time
*/

exports.growth = async function(req, res){

  const chart = await metrics.growth();
  return res.status(200).send({ data: chart });

}

/*
* metrics.accounts()
* returns summarised stats for your app usage
*/

exports.accounts = async function(req, res){

  const totalAccounts = await metrics.accounts();
  const activeAccounts = await metrics.accounts({ active: true });
  const churnedAccounts = await metrics.accounts({ active: false });

  return res.status(200).send({
    data: {
      totalAccounts: totalAccounts,
      activeAccounts: activeAccounts,
      churnedAccounts: churnedAccounts
    }
  });
}
