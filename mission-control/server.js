require('dotenv').config();
const express = require('express');
const api = require('./api');
const path = require('path');
const config = require('config');
const cors = require('cors');
const throttle = config.get('throttle');
const limiter = require('express-rate-limit');

const port = process.env.PORT || 5001;
const app = express();

// cors
app.use(cors({ origin: process.env.CLIENT_URL }));
app.options('*', cors({ origin: process.env.CLIENT_URL }));

// config express
app.use(express.json());
app.set('trust proxy', 1); // rate limit proxy
app.use(express.urlencoded({ extended: true }));

// api with rate limiter
app.use('/api/', limiter(throttle.api));
app.use(api);

// serve static files in production
if (process.env.NODE_ENV === 'production'){

  app.use(express.static(path.join(__dirname, 'client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/build/index.html'))
  });
}

// error handling
app.use(function(err, req, res, next){

  let message = null;

  if (err.raw){

    message = err.raw.message;

  }
  else if (err.message){

    message = err.message;

  }
  else if (err.sqlMessage){

    message = err.sqlMessage;

  }

  console.error(err);

  message ?
    res.status(500).send({ message: message }) :
    res.status(500).send(err);

});

// start server
const server = app.listen(port, async () => {

  const welcome = () => console.log('Welcome to Gravity Mission Control 🕹')
  welcome('de529c70-eb80-4dfb-9540-5075db7545bf')


});

module.exports = server;




