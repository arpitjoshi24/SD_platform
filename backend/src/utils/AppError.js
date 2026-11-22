/**
 * Operational error with an HTTP status code.
 * Throw this from services/controllers; the global error handler turns it into a JSON response.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = AppError;
