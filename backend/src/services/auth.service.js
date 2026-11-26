const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { generateToken } = require("../utils/jwt");
const { normalizeEmail, isValidTimeZone } = require("../utils/helpers");
const {
  ROLES,
  ACCOUNT_STATUSES,
  DEFAULT_TIMEZONE,
} = require("../utils/constants");
const {
  findUserByEmail,
  findUserById,
  findUserByIdForAuth,
  createUser,
} = require("../repositories/auth.repository");

const formatSafeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: String(user.role || ROLES.USER).toLowerCase(),
    account_status: String(user.account_status || ACCOUNT_STATUSES.ACTIVE).toLowerCase(),
    timezone: user.timezone || DEFAULT_TIMEZONE,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

const registerUser = async ({ full_name, email, password, timezone }) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const safeTimezone =
    timezone && isValidTimeZone(timezone) ? timezone.trim() : DEFAULT_TIMEZONE;

  try {
    const created = await createUser({
      full_name: String(full_name).trim(),
      email: normalizedEmail,
      password_hash,
      role: ROLES.USER,
      timezone: safeTimezone,
    });
    return formatSafeUser(created);
  } catch (err) {
    if (err?.code === "23505") {
      throw new AppError("An account with this email already exists", 409);
    }
    throw err;
  }
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  const invalid = new AppError("Invalid email or password", 401);
  if (!user || !user.password_hash) {
    throw invalid;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw invalid;
  }

  const status = String(
    user.account_status || ACCOUNT_STATUSES.ACTIVE
  ).toLowerCase();
  if (status === ACCOUNT_STATUSES.SUSPENDED) {
    throw new AppError("Your account has been suspended. Contact support.", 403);
  }

  if (status !== ACCOUNT_STATUSES.ACTIVE) {
    throw new AppError("Account is not active", 403);
  }

  const safeUser = formatSafeUser(user);
  const token = generateToken({
    id: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
  });

  return {
    user: safeUser,
    token,
  };
};

const getUserById = async (id) => {
  const user = await findUserByIdForAuth(id);
  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  const status = String(
    user.account_status || ACCOUNT_STATUSES.ACTIVE
  ).toLowerCase();
  if (status === ACCOUNT_STATUSES.SUSPENDED) {
    throw new AppError("Your account has been suspended. Contact support.", 403);
  }

  const fullSafe = await findUserById(id);
  return formatSafeUser(fullSafe || user);
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};