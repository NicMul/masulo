const express = require('express');
const dotenv = require('dotenv');
const db = require('./model/db');
const { apiKeyAuth } = require('./middleware/auth');
const processRouter = require('./api/process');
const { logStep, logError, logSuccess } = require('./utils/logger');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  logStep('📁', 'Created temp directory', { tempDir });
}

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes with authentication
app.use('/api', apiKeyAuth, processRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  logError('Unhandled error', err);
  res.status(500).send({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await db.connect();
    
    // Start Express server
    app.listen(PORT, () => {
      logSuccess(`AI Agent Server started on port ${PORT}`);
      logStep('🔑', 'API Key authentication enabled');
      logStep('📡', 'Endpoints available:');
      logStep('   ', '  GET  /health');
      logStep('   ', '  POST /api/process (requires X-API-Key header)');
    });
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logStep('🛑', 'SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logStep('🛑', 'SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

