const express = require('express');
const auth = require('../model/auth');
const gameController = require('../controller/gameController');
const api = express.Router();
const use = require('../helper/utility').use;

api.post('/api/game', auth.verify('user'), use(gameController.create));

api.get('/api/game', auth.verify('user'), use(gameController.get));

api.get('/api/game/:id', auth.verify('user'), use(gameController.get));

api.patch('/api/game/:id', auth.verify('user'), use(gameController.update));

api.delete('/api/game/:id', auth.verify('user'), use(gameController.delete));

module.exports = api;
