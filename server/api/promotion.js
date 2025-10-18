const express = require('express');
const auth = require('../model/auth');
const promotionController = require('../controller/promotionController');
const api = express.Router();
const use = require('../helper/utility').use;

api.post('/api/promotion', auth.verify('user'), use(promotionController.create));

api.get('/api/promotion', auth.verify('user'), use(promotionController.get));

api.get('/api/promotion/:id', auth.verify('user'), use(promotionController.get));

api.patch('/api/promotion/:id', auth.verify('user'), use(promotionController.update));

api.delete('/api/promotion/:id', auth.verify('user'), use(promotionController.delete));

module.exports = api;
