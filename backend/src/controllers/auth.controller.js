const {
  registerUser,
  loginUser,
  getUserById,
} = require("../services/auth.service");
const { successResponse } = require("../utils/response");

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
});

// POST /auth/register
const register = async (req, res) => {
  const user = await registerUser(req.body);

  return successResponse(res, "User registered successfully", user, 201);
};

// POST /auth/login
const login = async (req, res) => {
  const { user, token } = await loginUser(req.body);

  // Cookie is a fallback; the frontend sends the Bearer token.
  res.cookie("accessToken", token, {
    ...cookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return successResponse(res, "Login successful", { user, token });
};

// GET /auth/me
const getCurrentUser = async (req, res) => {
  const user = await getUserById(req.user.id);

  return successResponse(res, "User fetched successfully", user);
};

// POST /auth/logout
const logout = async (req, res) => {
  res.clearCookie("accessToken", cookieOptions());

  return successResponse(res, "Logged out successfully");
};

module.exports = { register, login, getCurrentUser, logout };
