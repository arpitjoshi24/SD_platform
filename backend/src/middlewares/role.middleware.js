const AppError = require("../utils/AppError");
const { ACCOUNT_STATUSES } = require("../utils/constants");

const requireRole = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles
    .flat()
    .map((role) => String(role || "").trim().toLowerCase())
    .filter(Boolean);

  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return next(new AppError("Unauthorized. Please login.", 401));
    }

    const status = String(req.user.account_status || ACCOUNT_STATUSES.ACTIVE).toLowerCase();
    if (status === ACCOUNT_STATUSES.SUSPENDED) {
      return next(new AppError("Your account has been suspended.", 403));
    }

    if (status !== ACCOUNT_STATUSES.ACTIVE) {
      return next(new AppError("Account is not active.", 403));
    }

    const userRole = String(req.user.role || "").toLowerCase();
    if (!normalizedAllowed.includes(userRole)) {
      return next(
        new AppError(
          "Forbidden. You do not have permission to perform this action.",
          403
        )
      );
    }

    return next();
  };
};

module.exports = { requireRole };