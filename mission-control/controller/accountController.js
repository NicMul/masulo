const account = require('../model/account');

/*
* account.get()
* get all the accounts
*/

exports.get = async function(req, res){

  const data = await account.get();
  return res.status(200).send({ data: data });

}