const express = require('express');
const auth = require('../model/auth');
const eventController = require('../controller/eventController');
const api = express.Router();
const use = require('../helper/utility').use;

api.get('/api/event', auth.verify('master'), use(eventController.get));

api.get('/api/event/:id', auth.verify('master'), use(eventController.get));

api.delete('/api/event', auth.verify('master'), use(eventController.delete));

module.exports = api;
