const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { generateToken } = require("../utils/jwt");
const {
  findUserByEmail,
  findUserById,
  createUser,
} = require("../repositories/auth.repository");

const registerUser = async ({ full_name, email, password }) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return createUser({
    full_name,
    email,
    password: hashedPassword,
  });
};

const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  // Same message for both cases: don't reveal which emails exist
  const invalid = new AppError("Invalid email or password", 401);

  if (!user) {
    throw invalid;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw invalid;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

const getUserById = async (id) => {
  const user = await findUserById(id);

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
