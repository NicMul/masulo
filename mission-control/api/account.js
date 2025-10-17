const express = require('express');
const auth = require('../model/auth');
const accountController = require('../controller/accountController');
const api = express.Router();
const use = require('../helper/utility').use;

/* master */
api.get('/api/account', auth.verify('master'), use(accountController.get));

module.exports = api;
