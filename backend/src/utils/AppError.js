/**
 * Operational error with an HTTP status code.
 * Throw this from services/controllers; the global error handler turns it into a JSON response.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined, code = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

module.exports = AppError;