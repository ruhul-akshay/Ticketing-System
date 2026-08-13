import winston from 'winston';
import chalk   from 'chalk';
import path    from 'path';
import fs      from 'fs';

// ── Ensure logs/ directory exists before Winston tries to write ───────────────
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ── Colour map for console output ────────────────────────────────────────────
const colours = {
  error: 'red',
  warn:  'yellow',
  info:  'green',
  http:  'magenta',
  debug: 'blue',
};

winston.addColors(colours);

// ── Console format (human-readable, coloured) ────────────────────────────────
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const color = colours[level] || 'white';
    const metaStr = Object.keys(meta).length
      ? ' ' + JSON.stringify(meta)
      : '';
    return `${timestamp} ${chalk[color](level.toUpperCase().padEnd(5))}: ${message}${metaStr}`;
  }),
);

// ── File format (JSON, structured — suitable for log aggregators) ─────────────
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    // Console: always on
    new winston.transports.Console({ format: consoleFormat }),

    // Error log: errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level:    'error',
      format:   fileFormat,
    }),

    // Combined log: everything
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format:   fileFormat,
    }),
  ],
});

// ── Morgan stream integration ─────────────────────────────────────────────────
export const stream = {
  write: (message) => logger.http(message.trimEnd()),
};

export { logger };