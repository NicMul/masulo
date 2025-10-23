const express = require('express');
const auth = require('../model/auth');
const groupController = require('../controller/groupController');
const api = express.Router();
const use = require('../helper/utility').use;

api.post('/api/group', auth.verify('user'), use(groupController.create));

api.get('/api/group', auth.verify('user'), use(groupController.get));

api.get('/api/group/:id', auth.verify('user'), use(groupController.get));

api.patch('/api/group/:id', auth.verify('user'), use(groupController.update));

api.delete('/api/group/:id', auth.verify('user'), use(groupController.delete));

module.exports = api;
