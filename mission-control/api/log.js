const express = require('express');
const auth = require('../model/auth');
const logController = require('../controller/logController');
const api = express.Router();
const use = require('../helper/utility').use;

api.get('/api/log', auth.verify('master'), use(logController.get));

api.get('/api/log/:id', auth.verify('master'), use(logController.get));

api.delete('/api/log', auth.verify('master'), use(logController.delete));

module.exports = api;
