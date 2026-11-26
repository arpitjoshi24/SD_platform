const { pool } = require("../config/db");

const PROJECT_COLUMNS = `
  up.id,
  up.user_id,
  up.title,
  up.project_mode,
  up.challenge_id,
  up.challenge_version_id,
  up.status,
  up.created_at,
  up.updated_at
`;

const createProject = async (
  {
    user_id,
    title,
    project_mode = "challenge",
    challenge_id = null,
    challenge_version_id = null,
    status = "in_progress",
  },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `INSERT INTO user_projects (
       user_id,
       title,
       project_mode,
       challenge_id,
       challenge_version_id,
       status
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
       id,
       user_id,
       title,
       project_mode,
       challenge_id,
       challenge_version_id,
       status,
       created_at,
       updated_at`,
    [user_id, title, project_mode, challenge_id, challenge_version_id, status]
  );

  const created = result.rows[0];
  await executor.query(
    `INSERT INTO project_attempt_counters (project_id, next_attempt_number)
     VALUES ($1, 1)
     ON CONFLICT (project_id) DO NOTHING`,
    [created.id]
  );

  return created;
};

const findProjectsByUserId = async (
  user_id,
  { project_mode = null } = {},
  client = null
) => {
  const executor = client || pool;
  const params = [user_id];
  let modeFilter = "";

  if (project_mode) {
    params.push(project_mode);
    modeFilter = `AND up.project_mode = $${params.length}`;
  }

  const result = await executor.query(
    `SELECT
       ${PROJECT_COLUMNS},
       c.title AS challenge_title,
       c.slug AS challenge_slug,
       c.difficulty AS challenge_difficulty,
       c.is_archived AS challenge_is_archived,
       cv.version_number AS challenge_version_number,
       COALESCE(att_stats.attempt_count, 0)::int AS attempt_count,
       latest_att.id AS latest_attempt_id,
       latest_att.attempt_number AS latest_attempt_number,
       latest_att.score::float AS latest_score,
       latest_att.grade AS latest_grade,
       latest_att.passed AS latest_passed,
       latest_att.saved_at AS latest_saved_at
     FROM user_projects up
     LEFT JOIN challenges c ON c.id = up.challenge_id
     LEFT JOIN challenge_versions cv ON cv.id = up.challenge_version_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS attempt_count
       FROM project_attempts pa
       WHERE pa.project_id = up.id
     ) att_stats ON TRUE
     LEFT JOIN LATERAL (
       SELECT id, attempt_number, score, grade, passed, saved_at
       FROM project_attempts pa
       WHERE pa.project_id = up.id
       ORDER BY pa.attempt_number DESC
       LIMIT 1
     ) latest_att ON TRUE
     WHERE up.user_id = $1
     ${modeFilter}
     ORDER BY up.updated_at DESC`,
    params
  );

  return result.rows;
};

const findChallengeProjects = (user_id, client = null) =>
  findProjectsByUserId(user_id, { project_mode: "challenge" }, client);

const findPracticeProjects = (user_id, client = null) =>
  findProjectsByUserId(user_id, { project_mode: "practice" }, client);

const findProjectById = async (project_id, user_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT
       ${PROJECT_COLUMNS},
       c.title AS challenge_title,
       c.slug AS challenge_slug,
       c.difficulty AS challenge_difficulty,
       c.is_archived AS challenge_is_archived,
       cv.version_number AS challenge_version_number
     FROM user_projects up
     LEFT JOIN challenges c ON c.id = up.challenge_id
     LEFT JOIN challenge_versions cv ON cv.id = up.challenge_version_id
     WHERE up.id = $1
       AND up.user_id = $2
     LIMIT 1`,
    [project_id, user_id]
  );
  return result.rows[0] || null;
};

const updateProjectTitle = async (
  { project_id, user_id, title },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `UPDATE user_projects
     SET
       title = $3,
       updated_at = NOW()
     WHERE id = $1
       AND user_id = $2
     RETURNING
       id,
       user_id,
       title,
       project_mode,
       challenge_id,
       challenge_version_id,
       status,
       created_at,
       updated_at`,
    [project_id, user_id, title]
  );
  return result.rows[0] || null;
};

const updateProjectStatus = async (
  { project_id, user_id, status },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `UPDATE user_projects
     SET
       status = $3,
       updated_at = NOW()
     WHERE id = $1
       AND user_id = $2
     RETURNING
       id,
       user_id,
       title,
       project_mode,
       challenge_id,
       challenge_version_id,
       status,
       created_at,
       updated_at`,
    [project_id, user_id, status]
  );
  return result.rows[0] || null;
};

const findProjectChallengeVersion = async (project_id, user_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT
       up.id AS project_id,
       up.project_mode,
       up.challenge_id,
       up.challenge_version_id,
       cv.version_number,
       cv.snapshot_config
     FROM user_projects up
     LEFT JOIN challenge_versions cv ON cv.id = up.challenge_version_id
     WHERE up.id = $1
       AND up.user_id = $2
     LIMIT 1`,
    [project_id, user_id]
  );
  return result.rows[0] || null;
};

const findProjectWithLatestAttempt = async (
  project_id,
  user_id,
  client = null
) => {
  const executor = client || pool;
  const project = await findProjectById(project_id, user_id, executor);
  if (!project) {
    return null;
  }

  const latestAttemptResult = await executor.query(
    `SELECT
       id,
       project_id,
       attempt_number,
       nodes_snapshot,
       edges_snapshot,
       evaluation_result,
       score::float AS score,
       grade,
       passed,
       summary,
       issues,
       evaluation_engine_version,
       challenge_version_id,
       simulation_config,
       simulation_result,
       simulation_engine_version,
       saved_at
     FROM project_attempts
     WHERE project_id = $1
     ORDER BY attempt_number DESC
     LIMIT 1`,
    [project_id]
  );

  const countResult = await executor.query(
    `SELECT COUNT(*)::int AS total_attempts
     FROM project_attempts
     WHERE project_id = $1`,
    [project_id]
  );

  return {
    project,
    total_attempts: countResult.rows[0]?.total_attempts ?? 0,
    latest_attempt: latestAttemptResult.rows[0] || null,
  };
};

const deleteProject = async ({ project_id, user_id }, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `DELETE FROM user_projects
     WHERE id = $1
       AND user_id = $2
     RETURNING id`,
    [project_id, user_id]
  );
  return result.rows[0] || null;
};

module.exports = {
  createProject,
  findProjectsByUserId,
  findChallengeProjects,
  findPracticeProjects,
  findProjectById,
  updateProjectTitle,
  updateProjectStatus,
  findProjectChallengeVersion,
  findProjectWithLatestAttempt,
  deleteProject,
};
