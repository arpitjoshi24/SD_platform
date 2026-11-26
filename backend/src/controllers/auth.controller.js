const {
  registerUser,
  loginUser,
  getUserById,
} = require("../services/auth.service");
const { successResponse } = require("../utils/response");

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

// POST /auth/register
const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    return successResponse(res, "User registered successfully", user, 201);
  } catch (err) {
    return next(err);
  }
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const { user, token } = await loginUser(req.body);

    res.cookie("accessToken", token, {
      ...cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, "Login successful", { user, token });
  } catch (err) {
    return next(err);
  }
};

// GET /auth/me
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    return successResponse(res, "User fetched successfully", user);
  } catch (err) {
    return next(err);
  }
};

// POST /auth/logout
const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken", cookieOptions());
    return successResponse(res, "Logged out successfully");
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login, getCurrentUser, logout };