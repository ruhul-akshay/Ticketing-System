import mongoose from 'mongoose';
import chalk from 'chalk';

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green('✓ MongoDB Connected'));
  } catch (err) {
    console.error(chalk.red('❌ MongoDB Connection failed:'), err);
    throw err;
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log(chalk.yellow('🔌 MongoDB Connection closed'));
  } catch (err) {
    console.error(chalk.red('❌ Error closing MongoDB connection:'), err);
  }
};
