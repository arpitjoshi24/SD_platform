const { pool } = require("../config/db");
const { ROLES, DEFAULT_TIMEZONE } = require("../utils/constants");

const SAFE_USER_COLUMNS = `
  id,
  full_name,
  email,
  role,
  account_status,
  timezone,
  created_at,
  updated_at
`;

const AUTH_USER_COLUMNS = `
  id,
  full_name,
  email,
  password_hash,
  role,
  account_status,
  timezone,
  created_at,
  updated_at
`;

const findUserByEmail = async (email, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT ${AUTH_USER_COLUMNS}
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [String(email).trim()]
  );
  return result.rows[0] || null;
};

const findUserById = async (id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT ${SAFE_USER_COLUMNS}
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
};

const findUserByIdForAuth = async (id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT id, full_name, email, role, account_status, timezone
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
};

const createUser = async (
  {
    full_name,
    email,
    password_hash,
    role = ROLES.USER,
    timezone = DEFAULT_TIMEZONE,
  },
  client = null
) => {
  const executor = client || pool;
  const normalizedRole = role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER;
  const result = await executor.query(
    `INSERT INTO users (full_name, email, password_hash, role, timezone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${SAFE_USER_COLUMNS}`,
    [full_name, email, password_hash, normalizedRole, timezone]
  );
  return result.rows[0];
};

const updateUserProfile = async (
  { user_id, full_name, timezone },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `UPDATE users
     SET
       full_name = COALESCE($2, full_name),
       timezone = COALESCE($3, timezone),
       updated_at = NOW()
     WHERE id = $1
     RETURNING ${SAFE_USER_COLUMNS}`,
    [user_id, full_name ?? null, timezone ?? null]
  );
  return result.rows[0] || null;
};

const updateAccountStatus = async (
  { user_id, account_status },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `UPDATE users
     SET
       account_status = $2,
       updated_at = NOW()
     WHERE id = $1
     RETURNING ${SAFE_USER_COLUMNS}`,
    [user_id, account_status]
  );
  return result.rows[0] || null;
};

const listUsers = async (
  {
    search = null,
    role = null,
    account_status = null,
    limit = 20,
    offset = 0,
  },
  client = null
) => {
  const executor = client || pool;
  const values = [];
  const conditions = [];

  if (search && String(search).trim() !== "") {
    values.push(`%${String(search).trim()}%`);
    conditions.push(
      `(full_name ILIKE $${values.length} OR email ILIKE $${values.length})`
    );
  }

  if (role) {
    values.push(role);
    conditions.push(`role = $${values.length}`);
  }

  if (account_status) {
    values.push(account_status);
    conditions.push(`account_status = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await executor.query(
    `SELECT COUNT(*)::int AS total FROM users ${whereClause}`,
    values
  );

  const listValues = [...values, limit, offset];
  const rowsResult = await executor.query(
    `SELECT ${SAFE_USER_COLUMNS}
     FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
    listValues
  );

  return {
    items: rowsResult.rows,
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
};

const findUserStatistics = async (user_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `WITH user_projs AS (
       SELECT id, project_mode, challenge_id, status
       FROM user_projects
       WHERE user_id = $1
     ),
     user_attempts AS (
       SELECT pa.id, pa.project_id, pa.score, pa.passed, pa.saved_at, up.project_mode, up.challenge_id
       FROM project_attempts pa
       JOIN user_projs up ON up.id = pa.project_id
     )
     SELECT
       COUNT(*) FILTER (WHERE project_mode = 'challenge')::int AS guided_projects_count,
       COUNT(*) FILTER (WHERE project_mode = 'practice')::int AS practice_projects_count,
       (SELECT COUNT(*)::int FROM user_attempts) AS total_saved_attempts,
       (SELECT COUNT(DISTINCT challenge_id)::int FROM user_projs WHERE project_mode = 'challenge' AND challenge_id IS NOT NULL) AS unique_challenges_attempted,
       COUNT(*) FILTER (WHERE project_mode = 'challenge' AND status = 'completed')::int AS completed_challenges_count,
       (SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0)::float FROM user_attempts WHERE score IS NOT NULL) AS average_score,
       (SELECT COALESCE(MAX(score), 0)::float FROM user_attempts WHERE score IS NOT NULL) AS highest_score
     FROM user_projs`,
    [user_id]
  );

  return (
    result.rows[0] || {
      guided_projects_count: 0,
      practice_projects_count: 0,
      total_saved_attempts: 0,
      unique_challenges_attempted: 0,
      completed_challenges_count: 0,
      average_score: 0,
      highest_score: 0,
    }
  );
};

module.exports = {
  findUserByEmail,
  findUserById,
  findUserByIdForAuth,
  createUser,
  updateUserProfile,
  updateAccountStatus,
  listUsers,
  findUserStatistics,
};