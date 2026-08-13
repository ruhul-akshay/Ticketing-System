import chalk from 'chalk';
import { logger } from './logger.js';

// ── Required environment variables (server cannot start without these) ────────
const REQUIRED_VARS = ['JWT_SECRET', 'MONGODB_URI'];

// ── Recommended variables (warn but don't exit if missing) ───────────────────
const RECOMMENDED_VARS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];

export const validateEnv = () => {
  // 1. Hard-required vars
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // 2. Validate MongoDB URI format
  if (!process.env.MONGODB_URI.startsWith('mongodb')) {
    logger.error('Invalid MONGODB_URI — must start with "mongodb"');
    process.exit(1);
  }

  // 3. Warn if JWT_SECRET is the insecure placeholder
  const insecurePlaceholder = 'your-secret-key-change-this-in-production';
  if (process.env.JWT_SECRET === insecurePlaceholder) {
    logger.warn(
      chalk.yellow('⚠  JWT_SECRET is using the default insecure placeholder. Change it before deploying to production.')
    );
  }

  // 4. Validate PORT is a valid number when set
  if (process.env.PORT && isNaN(Number(process.env.PORT))) {
    logger.error(`PORT environment variable must be a number. Got: "${process.env.PORT}"`);
    process.exit(1);
  }

  // 5. Soft-warn for missing email configuration (email sending will silently fail)
  const missingRecommended = RECOMMENDED_VARS.filter((v) => !process.env[v]);
  if (missingRecommended.length) {
    logger.warn(
      `Missing recommended environment variables: ${missingRecommended.join(', ')}. ` +
      'Email notifications will be disabled.'
    );
  }
};