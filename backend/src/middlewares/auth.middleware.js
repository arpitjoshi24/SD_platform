const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

/**
 * Auth strategy (single source of truth):
 *   Authorization: Bearer <token>   <- used by the frontend
 *   accessToken cookie              <- fallback only
 */
const extractToken = (req) => {
  const header = req.headers.authorization;

  if (header) {
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Invalid authorization format", 401);
    }

    return token;
  }

  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

const authMiddleware = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new AppError("Unauthorized. Please login.", 401);
  }

  // jwt errors (expired / invalid) are mapped to 401 by the error handler
  req.user = jwt.verify(token, process.env.JWT_SECRET);

  next();
};

module.exports = authMiddleware;
