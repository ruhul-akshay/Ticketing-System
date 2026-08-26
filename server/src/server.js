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

// Keep a reference to the HTTP server for graceful shutdown
let httpServer = null;

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

    httpServer = app.listen(PORT, '0.0.0.0', () => {
      logger.info(chalk.green(`🚀 Server running on http://0.0.0.0:${PORT}`));
    });

    // Handle listen errors (e.g. port already in use)
    httpServer.on('error', (err) => {
      logger.error(`❌ HTTP server error: ${err.message}`);
      process.exit(1);
    });

    return httpServer;
  } catch (err) {
    logger.error(`❌ Startup failed: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
};

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
// Easypanel / Docker sends SIGTERM when restarting or stopping a container.
// We close the HTTP server first (stop accepting new connections), then close
// the DB, then exit. A 10-second hard-kill timer ensures we never hang forever.
const handleShutdown = async (signal) => {
  logger.info(`Received ${signal} — shutting down gracefully…`);

  // Hard-kill safety: if graceful shutdown takes > 10s, force exit
  const killTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
  killTimer.unref(); // Don't let this timer keep the process alive by itself

  try {
    // 1. Stop accepting new HTTP requests
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed');
    }

    // 2. Close DB connection
    await closeDB();
    logger.info('Database connection closed');

    clearTimeout(killTimer);
    process.exit(0);
  } catch (err) {
    logger.error(`Error during shutdown: ${err.message}`);
    process.exit(1);
  }
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

