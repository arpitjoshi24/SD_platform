const { pool } = require("../config/db");

const SAFE_PROFILE_COLUMNS = `
  id,
  full_name,
  email,
  role,
  account_status,
  timezone,
  created_at,
  updated_at
`;

const getUserProfileById = async (user_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT ${SAFE_PROFILE_COLUMNS}
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [user_id]
  );
  return result.rows[0] || null;
};

const updateUserProfileById = async (
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
     RETURNING ${SAFE_PROFILE_COLUMNS}`,
    [user_id, full_name ?? null, timezone ?? null]
  );
  return result.rows[0] || null;
};

const getUserStatisticsById = async (user_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `WITH owned_projects AS (
       SELECT id, project_mode, challenge_id, status
       FROM user_projects
       WHERE user_id = $1
     ),
     owned_attempts AS (
       SELECT pa.id, pa.project_id, pa.score, pa.passed, pa.saved_at, op.project_mode, op.challenge_id
       FROM project_attempts pa
       JOIN owned_projects op ON op.id = pa.project_id
     )
     SELECT
       COUNT(*) FILTER (WHERE project_mode = 'challenge')::int AS challenge_projects_count,
       COUNT(*) FILTER (WHERE project_mode = 'practice')::int AS practice_projects_count,
       COUNT(*)::int AS total_projects_count,
       (SELECT COUNT(*)::int FROM owned_attempts) AS saved_attempts_count,
       (SELECT COUNT(*)::int FROM owned_attempts) AS evaluations_count,
       (SELECT COUNT(DISTINCT challenge_id)::int FROM owned_projects WHERE project_mode = 'challenge' AND challenge_id IS NOT NULL) AS unique_challenges_attempted,
       COUNT(*) FILTER (WHERE project_mode = 'challenge' AND status = 'completed')::int AS completed_challenges_count,
       (SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0)::float FROM owned_attempts WHERE score IS NOT NULL) AS average_score,
       (SELECT COALESCE(MAX(score), 0)::float FROM owned_attempts WHERE score IS NOT NULL) AS highest_score
     FROM owned_projects`,
    [user_id]
  );

  return (
    result.rows[0] || {
      challenge_projects_count: 0,
      practice_projects_count: 0,
      total_projects_count: 0,
      saved_attempts_count: 0,
      evaluations_count: 0,
      unique_challenges_attempted: 0,
      completed_challenges_count: 0,
      average_score: 0,
      highest_score: 0,
    }
  );
};

const getActivityHeatmapByUserId = async (
  { user_id, start_date = null, end_date = null },
  client = null
) => {
  const executor = client || pool;
  const params = [user_id];
  const conditions = ["user_id = $1", "event_type = 'attempt_saved'"];

  if (start_date) {
    params.push(start_date);
    conditions.push(`activity_date >= $${params.length}::date`);
  }
  if (end_date) {
    params.push(end_date);
    conditions.push(`activity_date <= $${params.length}::date`);
  }

  const result = await executor.query(
    `SELECT
       TO_CHAR(activity_date, 'YYYY-MM-DD') AS date,
       COUNT(*)::int AS count
     FROM activity_events
     WHERE ${conditions.join(" AND ")}
     GROUP BY activity_date
     ORDER BY activity_date ASC`,
    params
  );

  return result.rows;
};

const getActivityEventsByUserId = async (
  { user_id, limit = 50, offset = 0 },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT
       id,
       user_id,
       project_id,
       attempt_id,
       event_type,
       occurred_at,
       TO_CHAR(activity_date, 'YYYY-MM-DD') AS activity_date,
       timezone_at_event,
       created_at
     FROM activity_events
     WHERE user_id = $1
     ORDER BY occurred_at DESC
     LIMIT $2 OFFSET $3`,
    [user_id, limit, offset]
  );
  return result.rows;
};

module.exports = {
  getUserProfileById,
  updateUserProfileById,
  getUserStatisticsById,
  getActivityHeatmapByUserId,
  getActivityEventsByUserId,
};
