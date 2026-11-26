const jwt = require("jsonwebtoken");
const AppError = require("./AppError");

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || String(secret).trim().length < 16) {
    throw new AppError("JWT secret configuration is missing or weak", 500);
  }
  return secret;
};

const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || "7d") => {
  const secret = getSecret();
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token) => {
  const secret = getSecret();
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};