import { logger } from '../utils/logger.js';

/* ─────────────────────────────────────────────────────────────────────────────
   centralErrorHandler
   ─────────────────────────────────────────────────────────────────────────────
   A single Express 4-argument error middleware that:
   1. Normalises Mongoose, Multer, JWT, and validation errors into structured responses.
   2. Logs all errors with structured metadata (requestId, userId, route).
   3. Hides stack traces and raw messages from clients in production for 500 errors.
   ───────────────────────────────────────────────────────────────────────────── */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Map Mongoose / JWT / Multer errors to user-friendly AppError-compatible shapes.
 */
const normaliseError = (err) => {
  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return { statusCode: 400, message: `Invalid value for field '${err.path}'.` };
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message).join('; ');
    return { statusCode: 400, message: messages };
  }

  // Mongoose duplicate-key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return { statusCode: 409, message: `Duplicate value for '${field}'. This value already exists.` };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return { statusCode: 400, message: 'File size exceeds maximum limit of 10MB.' };
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
    return { statusCode: 400, message: 'Too many files uploaded or unexpected file field.' };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid token. Please log in again.' };
  }
  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Session expired. Please log in again.' };
  }

  return null; // Not a known mappable error
};

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const normalised   = normaliseError(err);
  const statusCode   = normalised?.statusCode ?? err.statusCode ?? 500;
  const rawMessage   = normalised?.message   ?? err.message ?? 'Internal Server Error';

  // Always log the full error details server-side
  logger.error({
    message:   err.message,
    stack:     err.stack,
    path:      req.path,
    method:    req.method,
    ip:        req.ip,
    requestId: req.id,
    userId:    req.user?.id ?? 'anonymous',
    statusCode,
  });

  // In production, never expose the raw message of a 500 (programmer bug)
  const clientMessage =
    isProduction && statusCode === 500 ? 'Internal Server Error' : rawMessage;

  // Ensure CORS headers are present on error responses
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(req.id && { requestId: req.id }),
    ...(!isProduction && { stack: err.stack }),
  });
};

/* ─────────────────────────────────────────────────────────────────────────────
   notFound — 404 handler for any route that didn't match a registered handler
   ───────────────────────────────────────────────────────────────────────────── */
export const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};