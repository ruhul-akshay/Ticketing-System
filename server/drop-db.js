import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function dropDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI not found in .env');
    }

    // 🔒 Safety guard
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ Refusing to drop database in PRODUCTION');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('💣 Dropping entire database...');
    await mongoose.connection.dropDatabase();

    console.log('✅ DATABASE DROPPED SUCCESSFULLY');
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED TO DROP DATABASE:', error.message);
    process.exit(1);
  }
}

dropDatabase();
