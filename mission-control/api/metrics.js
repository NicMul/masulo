const express = require('express');
const auth = require('../model/auth');
const metricsController = require('../controller/metricsController');
const api = express.Router();
const use = require('../helper/utility').use;

/* metrics */
api.get('/api/metrics/accounts', auth.verify('master'), use(metricsController.accounts));

api.get('/api/metrics/accounts/growth', auth.verify('master'), use(metricsController.growth));

module.exports = api;
