import dotenv from 'dotenv';
dotenv.config();

import fs    from 'fs/promises';
import chalk from 'chalk';

import app, { uploadsDir } from './app.js';
import { connectDB, closeDB } from './config/db.js';
import { validateEnv }        from './utils/envValidator.js';
import { logger }             from './utils/logger.js';

const PORT = Number(process.env.PORT) || 5000;

// ── Uploads Directory ─────────────────────────────────────────────────────────
const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    logger.info('📁 Uploads directory ready');
  } catch (err) {
    logger.error(`Error creating uploads directory: ${err.message}`);
  }
};

// ── Startup ───────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    validateEnv();
    await ensureUploadsDir();
    await connectDB();

    // Run client-initials migration (non-fatal if it fails)
    try {
      const { migrateClientInitials } = await import('./utils/ticket.helpers.js');
      await migrateClientInitials();
    } catch (migErr) {
      logger.error(`Client initials migration failed: ${migErr.message}`);
    }

    const server = app.listen(PORT, () => {
      logger.info(chalk.green(`🚀 Server running on http://localhost:${PORT}`));
    });

    // Expose server reference so graceful shutdown can close it
    return server;
  } catch (err) {
    logger.error(`❌ Startup failed: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
};

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const handleShutdown = async (signal) => {
  logger.info(`Received ${signal} — shutting down gracefully…`);
  await closeDB();
  process.exit(0);
};

process.on('SIGINT',  () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// ── Process-Level Safety Nets ─────────────────────────────────────────────────
// Catch unhandled promise rejections (e.g. a missing await somewhere).
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack:  reason instanceof Error ? reason.stack  : undefined,
  });
  // Give the logger time to flush, then exit cleanly
  setTimeout(() => process.exit(1), 500);
});

// Catch genuine programmer errors (synchronous throws at the top level).
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  // An uncaught exception means the process is in an unknown state — always exit.
  setTimeout(() => process.exit(1), 500);
});

startServer();
