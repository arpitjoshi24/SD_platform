const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  registerSchema,
  loginSchema,
} = require("../validators/auth.validator");
const {
  register,
  login,
  getCurrentUser,
  logout,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", logout);

module.exports = router;
