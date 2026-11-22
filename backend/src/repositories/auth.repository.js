const { pool } = require("../config/db");

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, full_name, email, role, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

const createUser = async ({ full_name, email, password }) => {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, full_name, email, role, created_at, updated_at`,
    [full_name, email, password]
  );

  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};
