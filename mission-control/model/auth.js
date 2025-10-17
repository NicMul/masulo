const jwt = require('jsonwebtoken');
const config = require('config');
const permissions = config.get('permissions');
const utility = require('../helper/utility');

/*
* auth.token()
* generate a JSON web token
*/

exports.token = function({ data, secret, duration }){

  return jwt.sign(data, secret || process.env.TOKEN_SECRET, { expiresIn: duration || settings.duration });

}

/*
* auth.verify()
* verify the user when using an api endpoint
*/

exports.verify = function(permission){

  return async function(req, res, next){
    
    try {

      utility.assert(req.headers['authorization'], 'No authorization header provided')
      const decode = jwt.verify(req.headers['authorization'].split(' ')[1], process.env.TOKEN_SECRET);

      if (decode.accountId && decode.userId && decode.permission && decode.provider){
        if (permission === 'public' || permissions[decode.permission][permission]){

          req.account = decode.accountId;
          req.user = decode.userId;
          req.permission = decode.permission;
          req.provider = decode.provider;
          next();

        } else throw new Error(); // user doesn't have permission
      }
      else throw { message: 'Invalid token' }; // invalid auth token

    }
    catch (err){      
      res.status(401).send({

        message: err.message || 'You do not have permission to perform this action.',

      });
    }
  }
}