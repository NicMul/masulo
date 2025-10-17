const express = require('express');
const auth = require('../model/auth');
const userController = require('../controller/userController');
const api = express.Router();
const use = require('../helper/utility').use;

api.get('/api/user', auth.verify('master'), use(userController.get));

api.post('/api/user/impersonate/:id', auth.verify('master'), use(userController.impersonate));

api.patch('/api/user', auth.verify('master'), use(userController.update));

api.patch('/api/user/:id', auth.verify('master'), use(userController.update));


module.exports = api;
