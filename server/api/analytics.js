const express = require('express');
const auth = require('../model/auth');
const analyticsController = require('../controller/analyticsController');
const api = express.Router();
const use = require('../helper/utility').use;

// Standard CRUD (all authenticated)
api.post('/api/analytics', auth.verify('user'), use(analyticsController.create));
api.post('/api/analytics/batch', auth.verify('user'), use(analyticsController.createMany));
api.get('/api/analytics', auth.verify('user'), use(analyticsController.get));

// Dashboard endpoint (must come before /:id route)
api.get('/api/analytics/dashboard', auth.verify('user'), use(analyticsController.getDashboardData));

// Aggregation endpoints
api.post('/api/analytics/aggregate', auth.verify('user'), use(analyticsController.aggregate));

// Parameterized routes (must come after specific routes)
api.get('/api/analytics/:id', auth.verify('user'), use(analyticsController.getById));
api.patch('/api/analytics/:id', auth.verify('user'), use(analyticsController.update));
api.delete('/api/analytics/:id', auth.verify('user'), use(analyticsController.delete));
api.delete('/api/analytics', auth.verify('user'), use(analyticsController.deleteMany));

module.exports = api;
