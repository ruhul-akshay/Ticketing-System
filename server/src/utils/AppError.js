/**
 * AppError — Operational error with an HTTP status code.
 *
 * Usage in services / controllers:
 *   throw new AppError('Ticket not found', 404);
 *
 * The centralized error handler in middleware/error.js distinguishes
 * AppError (isOperational = true) from unexpected programmer errors
 * (isOperational = false) and serializes them appropriately.
 */
export class AppError extends Error {
  /**
   * @param {string}  message    Human-readable error message
   * @param {number}  statusCode HTTP status code (default 500)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode  = statusCode;
    this.isOperational = true;           // Distinguish from programmer bugs
    Error.captureStackTrace(this, this.constructor);
  }
}
