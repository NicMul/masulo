const express = require('express');
const auth = require('../model/auth');
const feedbackController = require('../controller/feedbackController');
const api = express.Router();
const use = require('../helper/utility').use;

api.get('/api/feedback', auth.verify('master'), use(feedbackController.get));

api.get('/api/feedback/metrics', auth.verify('master'), use(feedbackController.metrics));

api.delete('/api/feedback', auth.verify('master'), use(feedbackController.delete));

module.exports = api;
