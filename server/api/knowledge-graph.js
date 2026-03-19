const express = require('express');
const auth = require('../model/auth');
const knowledgeGraphController = require('../controller/knowledgeGraphController');
const use = require('../helper/utility').use;

const api = express.Router();

api.get('/api/knowledge-graph/graph', auth.verify('user'), use(knowledgeGraphController.getGraph));
api.post('/api/knowledge-graph/query', auth.verify('user'), use(knowledgeGraphController.runQuery));
api.post('/api/knowledge-graph/nl-query', auth.verify('user'), use(knowledgeGraphController.nlQuery));

module.exports = api;
