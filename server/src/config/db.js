import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// ── Connection options for production resilience ──────────────────────────────
const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 10_000,   // Fail fast if DB is unreachable
  socketTimeoutMS:          45_000,   // Close sockets after 45 s of inactivity
  maxPoolSize:              10,        // Max concurrent connections in pool
};

export const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI, MONGOOSE_OPTIONS);
  logger.info('✓ MongoDB connected');

  // Connectivity monitoring
  mongoose.connection.on('disconnected', () =>
    logger.warn('MongoDB disconnected — attempting auto-reconnect…')
  );
  mongoose.connection.on('reconnected', () =>
    logger.info('MongoDB reconnected')
  );
  mongoose.connection.on('error', (err) =>
    logger.error(`MongoDB connection error: ${err.message}`)
  );
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('🔌 MongoDB connection closed gracefully');
  } catch (err) {
    logger.error(`Error closing MongoDB connection: ${err.message}`);
  }
};
