import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs/promises';
import chalk from 'chalk';
import app, { uploadsDir } from './app.js';
import { connectDB, closeDB } from './config/db.js';
import { validateEnv } from './utils/envValidator.js';

const PORT = process.env.PORT || 5000;

const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log(chalk.blue('📁 Uploads directory ready'));
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
};

const startServer = async () => {
  try {
    // 1. Validate Env Vars
    validateEnv();

    // 2. Setup Uploads Directory
    await ensureUploadsDir();

    // 3. Connect to Database
    await connectDB();

    // 4. Start Server
    app.listen(PORT, () => {
      console.log(chalk.green(`🚀 Server running on http://localhost:${PORT}`));
    });
  } catch (err) {
    console.error(chalk.red('❌ Startup failed:'), err);
    process.exit(1);
  }
};

// ======================= GRACEFUL SHUTDOWN =======================
const handleShutdown = async (signal) => {
  console.log(chalk.yellow(`\nReceived ${signal}. Shutting down...`));
  await closeDB();
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();
