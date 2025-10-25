const express = require('express');
const auth = require('../model/auth');
const analyticsController = require('../controller/analyticsController');
const api = express.Router();
const use = require('../helper/utility').use;

// Public analytics creation (for SDK events)
api.post('/api/analytics', auth.verify('public'), use(analyticsController.create));

// Protected analytics retrieval (requires authentication)
api.get('/api/analytics', auth.verify('user'), use(analyticsController.get));
api.get('/api/analytics/aggregate', auth.verify('user'), use(analyticsController.aggregate));
api.get('/api/analytics/dashboard', auth.verify('user'), use(analyticsController.getDashboardData));
api.get('/api/analytics/game/:game_id', auth.verify('user'), use(analyticsController.getByGame));
api.delete('/api/analytics/:id', auth.verify('user'), use(analyticsController.delete));

module.exports = api;
