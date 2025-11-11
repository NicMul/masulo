const mongoose = require('mongoose');
const { logStep, logError } = require('../utils/logger');

exports.connect = async (settings) => {
  try {
    const url = `mongodb+srv://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}/${process.env.DB_NAME}`;
    
    logStep('🔌', 'Connecting to MongoDB...');
    await mongoose.connect(url);
    logStep('✅', 'Connected to MongoDB');
  } catch (err) {
    logError('Failed to connect to MongoDB', err);
    throw err;
  }
};

