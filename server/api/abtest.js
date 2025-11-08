const express = require('express');
const auth = require('../model/auth');
const abtestController = require('../controller/abtestController');
const api = express.Router();
const use = require('../helper/utility').use;

api.post('/api/ab-test', auth.verify('user'), use(abtestController.create));

api.get('/api/ab-test', auth.verify('user'), use(abtestController.get));

api.get('/api/ab-test/:id', auth.verify('user'), use(abtestController.get));

api.patch('/api/ab-test/:id', auth.verify('user'), use(abtestController.update));

api.delete('/api/ab-test/:id', auth.verify('user'), use(abtestController.delete));

module.exports = api;

