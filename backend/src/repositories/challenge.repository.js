const { pool } = require("../config/db");

const PUBLIC_CHALLENGE_COLUMNS = `
  c.id,
  c.title,
  c.slug,
  c.description,
  c.difficulty,
  c.category,
  c.estimated_minutes,
  c.requirements,
  c.hints,
  c.is_published,
  c.is_archived,
  c.current_version_number,
  c.created_at,
  c.updated_at
`;

const findAllPublishedChallenges = async (client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT ${PUBLIC_CHALLENGE_COLUMNS}
     FROM challenges c
     WHERE c.is_published = TRUE
       AND c.is_archived = FALSE
     ORDER BY c.created_at DESC`
  );
  return result.rows;
};

const findAllChallengesForAdmin = async (
  { includeArchived = true, search = null, limit = 50, offset = 0 } = {},
  client = null
) => {
  const executor = client || pool;
  const values = [];
  const conditions = [];

  if (!includeArchived) {
    conditions.push("c.is_archived = FALSE");
  }
  if (search && String(search).trim() !== "") {
    values.push(`%${String(search).trim()}%`);
    conditions.push(
      `(c.title ILIKE $${values.length} OR c.slug ILIKE $${values.length} OR COALESCE(c.category, '') ILIKE $${values.length})`
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await executor.query(
    `SELECT COUNT(*)::int AS total FROM challenges c ${whereClause}`,
    values
  );

  const listValues = [...values, limit, offset];
  const rowsResult = await executor.query(
    `SELECT ${PUBLIC_CHALLENGE_COLUMNS}
     FROM challenges c
     ${whereClause}
     ORDER BY c.created_at DESC
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

const findChallengeById = async (
  id,
  { includeUnpublished = false } = {},
  client = null
) => {
  const executor = client || pool;
  const visibilityFilter = includeUnpublished
    ? ""
    : "AND c.is_published = TRUE AND c.is_archived = FALSE";

  const result = await executor.query(
    `SELECT ${PUBLIC_CHALLENGE_COLUMNS}
     FROM challenges c
     WHERE c.id = $1
     ${visibilityFilter}
     LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
};

const findChallengeBySlug = async (
  slug,
  { includeUnpublished = false } = {},
  client = null
) => {
  const executor = client || pool;
  const visibilityFilter = includeUnpublished
    ? ""
    : "AND c.is_published = TRUE AND c.is_archived = FALSE";

  const result = await executor.query(
    `SELECT ${PUBLIC_CHALLENGE_COLUMNS}
     FROM challenges c
     WHERE c.slug = $1
     ${visibilityFilter}
     LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
};

const findChallengeCurrentVersion = async (challenge_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT cv.id, cv.challenge_id, cv.version_number, cv.snapshot_config, cv.created_by, cv.created_at
     FROM challenge_versions cv
     JOIN challenges c
       ON c.id = cv.challenge_id
      AND c.current_version_number = cv.version_number
     WHERE cv.challenge_id = $1
     LIMIT 1`,
    [challenge_id]
  );
  return result.rows[0] || null;
};

const findChallengeVersionById = async (version_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT id, challenge_id, version_number, snapshot_config, created_by, created_at
     FROM challenge_versions
     WHERE id = $1
     LIMIT 1`,
    [version_id]
  );
  return result.rows[0] || null;
};

const createChallenge = async (
  {
    title,
    slug,
    description,
    difficulty,
    category = null,
    estimated_minutes = null,
    requirements = [],
    hints = [],
    is_published = false,
    is_archived = false,
    current_version_number = 1,
    created_by = null,
  },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `INSERT INTO challenges (
       title,
       slug,
       description,
       difficulty,
       category,
       estimated_minutes,
       requirements,
       hints,
       is_published,
       is_archived,
       current_version_number,
       created_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12)
     RETURNING
       id,
       title,
       slug,
       description,
       difficulty,
       category,
       estimated_minutes,
       requirements,
       hints,
       is_published,
       is_archived,
       current_version_number,
       created_by,
       created_at,
       updated_at`,
    [
      title,
      slug,
      description,
      difficulty,
      category,
      estimated_minutes,
      JSON.stringify(requirements),
      JSON.stringify(hints),
      Boolean(is_published),
      Boolean(is_archived),
      current_version_number,
      created_by,
    ]
  );
  return result.rows[0];
};

const updateChallenge = async (
  {
    challenge_id,
    title,
    slug,
    description,
    difficulty,
    category,
    estimated_minutes,
    requirements,
    hints,
    is_published,
    current_version_number,
  },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `UPDATE challenges
     SET
       title = COALESCE($2, title),
       slug = COALESCE($3, slug),
       description = COALESCE($4, description),
       difficulty = COALESCE($5, difficulty),
       category = COALESCE($6, category),
       estimated_minutes = COALESCE($7, estimated_minutes),
       requirements = COALESCE($8::jsonb, requirements),
       hints = COALESCE($9::jsonb, hints),
       is_published = COALESCE($10, is_published),
       current_version_number = COALESCE($11, current_version_number),
       updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       title,
       slug,
       description,
       difficulty,
       category,
       estimated_minutes,
       requirements,
       hints,
       is_published,
       is_archived,
       current_version_number,
       created_by,
       created_at,
       updated_at`,
    [
      challenge_id,
      title ?? null,
      slug ?? null,
      description ?? null,
      difficulty ?? null,
      category ?? null,
      estimated_minutes ?? null,
      requirements !== undefined ? JSON.stringify(requirements) : null,
      hints !== undefined ? JSON.stringify(hints) : null,
      is_published !== undefined ? Boolean(is_published) : null,
      current_version_number ?? null,
    ]
  );
  return result.rows[0] || null;
};

const setChallengeArchiveState = async (
  { challenge_id, is_archived },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `UPDATE challenges
     SET
       is_archived = $2,
       is_published = CASE WHEN $2 = TRUE THEN FALSE ELSE is_published END,
       updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       title,
       slug,
       is_published,
       is_archived,
       current_version_number,
       updated_at`,
    [challenge_id, Boolean(is_archived)]
  );
  return result.rows[0] || null;
};

const archiveChallenge = (challenge_id, client = null) =>
  setChallengeArchiveState({ challenge_id, is_archived: true }, client);

const restoreChallenge = (challenge_id, client = null) =>
  setChallengeArchiveState({ challenge_id, is_archived: false }, client);

const deleteChallengePermanently = async (challenge_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `DELETE FROM challenges
     WHERE id = $1
     RETURNING id`,
    [challenge_id]
  );
  return result.rows[0] || null;
};

const createChallengeVersion = async (
  { challenge_id, version_number, snapshot_config, created_by = null },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `INSERT INTO challenge_versions (
       challenge_id,
       version_number,
       snapshot_config,
       created_by
     )
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING id, challenge_id, version_number, snapshot_config, created_by, created_at`,
    [challenge_id, version_number, JSON.stringify(snapshot_config), created_by]
  );
  return result.rows[0];
};

const updateChallengeVersionSnapshot = async (
  { challenge_version_id, snapshot_config },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `UPDATE challenge_versions
     SET snapshot_config = $2::jsonb
     WHERE id = $1
     RETURNING id, challenge_id, version_number, snapshot_config, created_at`,
    [challenge_version_id, JSON.stringify(snapshot_config)]
  );
  return result.rows[0] || null;
};

const createChallengeRuleAssignments = async (
  challenge_version_id,
  assignments = [],
  client = null
) => {
  const executor = client || pool;
  const inserted = [];

  for (const item of assignments) {
    const result = await executor.query(
      `INSERT INTO challenge_rule_assignments (
         challenge_version_id,
         rule_id,
         rule_version_id,
         is_enabled,
         config_override
       )
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (challenge_version_id, rule_id)
       DO UPDATE SET
         rule_version_id = EXCLUDED.rule_version_id,
         is_enabled = EXCLUDED.is_enabled,
         config_override = EXCLUDED.config_override
       RETURNING
         id,
         challenge_version_id,
         rule_id,
         rule_version_id,
         is_enabled,
         config_override,
         created_at`,
      [
        challenge_version_id,
        item.rule_id,
        item.rule_version_id,
        item.is_enabled !== undefined ? Boolean(item.is_enabled) : true,
        JSON.stringify(item.config_override || {}),
      ]
    );
    inserted.push(result.rows[0]);
  }

  return inserted;
};

const findChallengeRuleAssignments = async (challenge_version_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT
       cra.id,
       cra.challenge_version_id,
       cra.rule_id,
       cra.rule_version_id,
       cra.is_enabled,
       cra.config_override,
       cra.created_at,
       r.rule_key,
       r.name,
       r.description,
       r.rule_type,
       r.category,
       r.severity,
       r.is_mandatory,
       r.is_active,
       rv.version_number AS rule_version_number,
       rv.config AS rule_version_config
     FROM challenge_rule_assignments cra
     JOIN rules r ON r.id = cra.rule_id
     JOIN rule_versions rv ON rv.id = cra.rule_version_id
     WHERE cra.challenge_version_id = $1
     ORDER BY r.rule_type ASC, r.rule_key ASC`,
    [challenge_version_id]
  );
  return result.rows;
};

const findChallengeStatistics = async (challenge_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `WITH c_projects AS (
       SELECT id, user_id, status
       FROM user_projects
       WHERE project_mode = 'challenge' AND challenge_id = $1
     ),
     c_attempts AS (
       SELECT pa.id, pa.project_id, pa.score, pa.passed
       FROM project_attempts pa
       JOIN c_projects cp ON cp.id = pa.project_id
     )
     SELECT
       (SELECT COUNT(*)::int FROM c_projects) AS total_projects,
       (SELECT COUNT(DISTINCT user_id)::int FROM c_projects) AS unique_participants,
       (SELECT COUNT(*)::int FROM c_projects WHERE status = 'completed') AS completed_projects,
       (SELECT COUNT(*)::int FROM c_attempts) AS total_attempts,
       (SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0)::float FROM c_attempts WHERE score IS NOT NULL) AS average_score,
       (SELECT COALESCE(MAX(score), 0)::float FROM c_attempts WHERE score IS NOT NULL) AS highest_score`,
    [challenge_id]
  );
  return result.rows[0];
};

const findChallengeParticipants = async (challenge_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT
       u.id AS user_id,
       u.full_name,
       u.email,
       up.id AS project_id,
       up.title AS project_title,
       up.status AS project_status,
       up.challenge_version_id,
       up.updated_at AS last_updated_at,
       COUNT(pa.id)::int AS attempt_count,
       MAX(pa.score)::float AS best_score
     FROM user_projects up
     JOIN users u ON u.id = up.user_id
     LEFT JOIN project_attempts pa ON pa.project_id = up.id
     WHERE up.project_mode = 'challenge' AND up.challenge_id = $1
     GROUP BY u.id, u.full_name, u.email, up.id, up.title, up.status, up.challenge_version_id, up.updated_at
     ORDER BY up.updated_at DESC`,
    [challenge_id]
  );
  return result.rows;
};

const findChallengeEvaluationContext = async (
  challenge_id,
  challenge_version_id = null,
  client = null
) => {
  const executor = client || pool;
  const versionRow = challenge_version_id
    ? await findChallengeVersionById(challenge_version_id, executor)
    : await findChallengeCurrentVersion(challenge_id, executor);

  if (!versionRow || versionRow.challenge_id !== challenge_id) {
    return null;
  }

  const assignments = await findChallengeRuleAssignments(versionRow.id, executor);
  return {
    challenge_id,
    challenge_version: versionRow,
    assignments,
  };
};

module.exports = {
  findAllPublishedChallenges,
  findAllChallengesForAdmin,
  findChallengeById,
  findChallengeBySlug,
  findChallengeCurrentVersion,
  findChallengeVersionById,
  createChallenge,
  updateChallenge,
  setChallengeArchiveState,
  archiveChallenge,
  restoreChallenge,
  deleteChallengePermanently,
  createChallengeVersion,
  updateChallengeVersionSnapshot,
  createChallengeRuleAssignments,
  findChallengeRuleAssignments,
  findChallengeStatistics,
  findChallengeParticipants,
  findChallengeEvaluationContext,
};