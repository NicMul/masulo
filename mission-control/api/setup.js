/* delete me after setup */
const express = require('express');
const setupController = require('../controller/setupController');
const api = express.Router();
const use = require('../helper/utility').use;

api.get('/api/setup/database', use(setupController.database));

api.post('/api/setup/database', use(setupController.database.update));

api.post('/api/setup/account', use(setupController.account));

api.get('/api/setup/url', use(setupController.url));

api.post('/api/setup/url', use(setupController.url.update));

api.post('/api/setup/token', use(setupController.token));

api.post('/api/setup/stripe', use(setupController.stripe.update));

module.exports = api;
