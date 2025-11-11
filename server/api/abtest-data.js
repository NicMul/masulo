const express = require('express');
const auth = require('../model/auth');
const abtestDataController = require('../controller/abtestDataController');
const api = express.Router();
const use = require('../helper/utility').use;


api.post('/api/ab-test-data', auth.verify('user'), use(abtestDataController.create));

api.get('/api/ab-test-data', auth.verify('user'), use(abtestDataController.get));

api.get('/api/ab-test-data/stats', auth.verify('user'), use(abtestDataController.getStats));

api.get('/api/ab-test-data/timeseries', auth.verify('user'), use(abtestDataController.getTimeSeries));

api.post('/api/ab-test-data/aggregate', auth.verify('user'), use(abtestDataController.aggregate));

api.get('/api/ab-test-data/:id', auth.verify('user'), use(abtestDataController.getById));

api.patch('/api/ab-test-data/:id', auth.verify('user'), use(abtestDataController.update));

api.delete('/api/ab-test-data/:id', auth.verify('user'), use(abtestDataController.delete));

api.delete('/api/ab-test-data', auth.verify('user'), use(abtestDataController.deleteMany));

module.exports = api;


