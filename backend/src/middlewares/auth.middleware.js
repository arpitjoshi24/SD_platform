const AppError = require("../utils/AppError");
const { verifyToken } = require("../utils/jwt");
const { findUserByIdForAuth } = require("../repositories/auth.repository");
const { ACCOUNT_STATUSES, ROLES, DEFAULT_TIMEZONE } = require("../utils/constants");

/**
 * Auth strategy (single source of truth):
 *   Authorization: Bearer <token>   <- used by the frontend
 *   accessToken cookie              <- fallback only
 */
const extractToken = (req) => {
  const header = req.headers.authorization;

  if (header !== undefined && header !== null) {
    const trimmed = String(header).trim();
    if (!trimmed) {
      throw new AppError("Invalid authorization format", 401);
    }

    const parts = trimmed.split(/\s+/);
    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== "bearer" ||
      !parts[1]
    ) {
      throw new AppError("Invalid authorization format", 401);
    }

    return parts[1];
  }

  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError("Unauthorized. Please login.", 401);
    }

    const decoded = verifyToken(token);
    const userId = decoded?.id || decoded?.sub;

    if (!decoded || typeof decoded !== "object" || !userId) {
      throw new AppError("Invalid token payload", 401);
    }

    const dbUser = await findUserByIdForAuth(userId);
    if (!dbUser) {
      throw new AppError("User account no longer exists", 401);
    }

    const status = String(dbUser.account_status || ACCOUNT_STATUSES.ACTIVE).toLowerCase();
    if (status === ACCOUNT_STATUSES.SUSPENDED) {
      throw new AppError("Your account has been suspended. Contact support.", 403);
    }

    if (status !== ACCOUNT_STATUSES.ACTIVE) {
      throw new AppError("Account is not active", 403);
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      full_name: dbUser.full_name,
      role: String(dbUser.role || ROLES.USER).toLowerCase(),
      account_status: status,
      timezone: dbUser.timezone || DEFAULT_TIMEZONE,
    };

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = authMiddleware;