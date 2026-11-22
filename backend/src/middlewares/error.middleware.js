const AppError = require("../utils/AppError");
const { errorResponse } = require("../utils/response");

// 404 for unknown routes
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const isZodError = (err) =>
  err && (err.name === "ZodError" || Array.isArray(err.issues));

// Global error handler (must have 4 params)
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Request body validation (zod)
  if (isZodError(err)) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    const message = details[0]?.message || "Validation failed";

    return errorResponse(res, message, 400, details);
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    return errorResponse(res, "Invalid JSON in request body", 400);
  }

  // JWT problems
  if (err.name === "TokenExpiredError") {
    return errorResponse(res, "Session expired. Please login again.", 401);
  }

  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, "Invalid token", 401);
  }

  // PostgreSQL errors -> friendly messages (never leak SQL details)
  switch (err.code) {
    case "22P02": // invalid_text_representation (e.g. bad UUID)
      return errorResponse(res, "Invalid identifier format", 400);
    case "23503": // foreign_key_violation
      return errorResponse(res, "Referenced resource does not exist", 400);
    case "23505": // unique_violation
      return errorResponse(res, "Resource already exists", 409);
    default:
      break;
  }

  // Our own errors
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.details);
  }

  // Unknown -> log and hide internals
  console.error("UNHANDLED ERROR:", err);

  return errorResponse(res, "Internal server error", 500);
};

module.exports = { notFoundHandler, errorHandler };
