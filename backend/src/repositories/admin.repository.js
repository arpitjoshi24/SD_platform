const { pool } = require("../config/db");

const getPlatformDashboardStats = async (client = null) => {
  const executor = client || pool;

  const result = await executor.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'user') AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'user' AND account_status = 'active') AS active_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'user' AND account_status = 'suspended') AS suspended_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS total_admins,
      (SELECT COUNT(*)::int FROM challenges WHERE is_archived = FALSE) AS active_challenges,
      (SELECT COUNT(*)::int FROM challenges WHERE is_published = TRUE AND is_archived = FALSE) AS published_challenges,
      (SELECT COUNT(*)::int FROM challenges WHERE is_archived = TRUE) AS archived_challenges,
      (SELECT COUNT(*)::int FROM rules WHERE is_active = TRUE) AS active_rules,
      (SELECT COUNT(*)::int FROM user_projects WHERE project_mode = 'challenge') AS total_challenge_projects,
      (SELECT COUNT(*)::int FROM user_projects WHERE project_mode = 'practice') AS total_practice_projects,
      (SELECT COUNT(*)::int FROM project_attempts) AS total_attempts,
      (SELECT COUNT(*)::int FROM project_attempts WHERE passed = TRUE) AS passed_attempts,
      (SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0)::float FROM project_attempts WHERE score IS NOT NULL) AS average_score
  `);

  const recentAttemptsResult = await executor.query(`
    SELECT
      pa.id,
      pa.project_id,
      pa.attempt_number,
      pa.score::float AS score,
      pa.grade,
      pa.passed,
      pa.saved_at,
      up.title AS project_title,
      up.project_mode,
      u.id AS user_id,
      u.full_name AS user_name,
      u.email AS user_email,
      c.title AS challenge_title
    FROM project_attempts pa
    JOIN user_projects up ON up.id = pa.project_id
    JOIN users u ON u.id = up.user_id
    LEFT JOIN challenges c ON c.id = up.challenge_id
    ORDER BY pa.saved_at DESC
    LIMIT 10
  `);

  return {
    metrics: result.rows[0],
    recent_attempts: recentAttemptsResult.rows,
  };
};

module.exports = {
  getPlatformDashboardStats,
};