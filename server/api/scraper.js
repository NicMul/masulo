const express = require('express');
const auth = require('../model/auth');
const scraperController = require('../controller/scraperController');
const api = express.Router();
const use = require('../helper/utility').use;

api.post('/api/scraper', auth.verify('user'), use(scraperController.handle));

module.exports = api;
