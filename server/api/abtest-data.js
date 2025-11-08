const express = require('express');
const auth = require('../model/auth');
const abtestDataController = require('../controller/abtestDataController');
const api = express.Router();
const use = require('../helper/utility').use;

// Create a new AB test data entry
api.post('/api/ab-test-data', auth.verify('user'), use(abtestDataController.create));

// Get all AB test data entries (with optional filters via query params)
api.get('/api/ab-test-data', auth.verify('user'), use(abtestDataController.get));

// Get aggregated stats for AB test (clicks, impressions, CTR) - MUST come before /:id route
api.get('/api/ab-test-data/stats', auth.verify('user'), use(abtestDataController.getStats));

// Get time series data for AB test (clicks and impressions over time)
api.get('/api/ab-test-data/timeseries', auth.verify('user'), use(abtestDataController.getTimeSeries));

// Run aggregation queries on AB test data
api.post('/api/ab-test-data/aggregate', auth.verify('user'), use(abtestDataController.aggregate));

// Get a specific AB test data entry by id
api.get('/api/ab-test-data/:id', auth.verify('user'), use(abtestDataController.getById));

// Update an AB test data entry by id
api.patch('/api/ab-test-data/:id', auth.verify('user'), use(abtestDataController.update));

// Delete a specific AB test data entry by id
api.delete('/api/ab-test-data/:id', auth.verify('user'), use(abtestDataController.delete));

// Delete multiple AB test data entries (with filters via query params)
api.delete('/api/ab-test-data', auth.verify('user'), use(abtestDataController.deleteMany));

module.exports = api;


