const AppError = require("../utils/AppError");
const { errorResponse } = require("../utils/response");

// 404 for unknown routes
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const isZodError = (err) =>
  err && (err.name === "ZodError" || Array.isArray(err.issues));

// Global error handler (must have 4 params for Express error handling)
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || req.headers["x-request-id"] || null;

  // Zod validation errors
  if (isZodError(err)) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    const message = details[0]?.message || "Validation failed";
    return errorResponse(res, message, 400, details);
  }

  // Express JSON body parser errors
  if (err.type === "entity.parse.failed") {
    return errorResponse(res, "Invalid JSON in request body", 400);
  }

  if (err.type === "entity.too.large") {
    return errorResponse(res, "Request payload exceeds size limit", 413);
  }

  // Rate-limiter errors
  if (err.statusCode === 429 || err.status === 429) {
    return errorResponse(
      res,
      err.message || "Too many requests. Please try again later.",
      429
    );
  }

  // JWT errors
  if (err.name === "TokenExpiredError") {
    return errorResponse(res, "Session expired. Please login again.", 401);
  }

  if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
    return errorResponse(res, "Invalid or malformed token", 401);
  }

  // PostgreSQL error mapping (never leak internal SQL or constraint details)
  switch (err.code) {
    case "22P02": // invalid_text_representation (e.g., invalid UUID)
      return errorResponse(res, "Invalid identifier format", 400);
    case "22007": // invalid_datetime_format
    case "22008": // datetime_field_overflow
      return errorResponse(res, "Invalid date or timestamp value", 400);
    case "23502": // not_null_violation
      return errorResponse(res, "Required field is missing", 400);
    case "23503": // foreign_key_violation
      return errorResponse(res, "Referenced resource does not exist", 400);
    case "23505": // unique_violation
      return errorResponse(res, "Resource already exists or conflicts with an existing record", 409);
    case "23514": // check_violation
      return errorResponse(res, "Data violates domain or state constraints", 400);
    case "40001": // serialization_failure
    case "40P01": // deadlock_detected
      return errorResponse(
        res,
        "Concurrent operation conflict. Please retry your request.",
        409
      );
    case "53300": // too_many_connections
    case "57P01": // admin_shutdown
    case "57P02": // crash_shutdown
    case "57P03": // cannot_connect_now
      console.error("DATABASE AVAILABILITY ERROR:", { requestId, code: err.code });
      return errorResponse(res, "Service temporarily unavailable", 503);
    default:
      break;
  }

  // Expected operational application errors
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.details);
  }

  // Unexpected error: log safely without leaking internals
  console.error("UNHANDLED ERROR:", {
    requestId,
    method: req.method,
    path: req.originalUrl,
    message: err?.message,
    stack: err?.stack,
  });

  return errorResponse(res, "Internal server error", 500);
};

module.exports = { notFoundHandler, errorHandler };