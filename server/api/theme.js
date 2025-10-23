const express = require('express');
const auth = require('../model/auth');
const themeController = require('../controller/themeController');
const api = express.Router();
const use = require('../helper/utility').use;

api.post('/api/theme', auth.verify('user'), use(themeController.create));

api.get('/api/theme', auth.verify('user'), use(themeController.get));

api.get('/api/theme/:id', auth.verify('user'), use(themeController.get));

api.patch('/api/theme/:id', auth.verify('user'), use(themeController.update));

api.delete('/api/theme/:id', auth.verify('user'), use(themeController.delete));

module.exports = api;
