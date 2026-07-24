const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

/**
 * Connects to MongoDB with retry logic.
 * @param {number} retries - Number of retry attempts
 */
async function connectDB(retries = 5) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-form-autofill';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info(`✅ MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      logger.warn(`MongoDB attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) {
        throw new Error(`Failed to connect after ${retries} attempts`);
      }
      await new Promise(r => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
    }
  }
}

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB closed on app termination');
  process.exit(0);
});

module.exports = { connectDB };
