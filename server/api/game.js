const express = require('express');
const multer = require('multer');
const auth = require('../model/auth');
const gameController = require('../controller/gameController');
const api = express.Router();
const use = require('../helper/utility').use;
const upload = multer({ dest: 'uploads' });

api.post('/api/game', auth.verify('user'), use(gameController.create));

api.post('/api/game/bulk', auth.verify('user'), upload.single('file'), use(gameController.bulkCreate));

api.get('/api/game/template', auth.verify('user'), use(gameController.downloadTemplate));

api.get('/api/game', auth.verify('user'), use(gameController.get));

api.get('/api/game/:id', auth.verify('user'), use(gameController.get));

api.patch('/api/game/:id', auth.verify('user'), use(gameController.update));

api.delete('/api/game/:id/test-assets', auth.verify('user'), use(gameController.deleteTestAssets));

api.post('/api/game/:id/test-assets/accept', auth.verify('user'), use(gameController.acceptTestAssets));

api.post('/api/game/:id/test-assets/archive', auth.verify('user'), use(gameController.archiveTestAssets));

api.delete('/api/game/:id', auth.verify('user'), use(gameController.delete));

module.exports = api;
