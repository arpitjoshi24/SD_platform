const { pool } = require("../config/db");

const ATTEMPT_COLUMNS = `
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
  idempotency_key,
  saved_at
`;

const allocateAttemptNumber = async (project_id, client) => {
  if (!client) {
    throw new Error("allocateAttemptNumber requires a transaction client");
  }

  await client.query(
    `INSERT INTO project_attempt_counters (project_id, next_attempt_number)
     VALUES ($1, 1)
     ON CONFLICT (project_id) DO NOTHING`,
    [project_id]
  );

  const result = await client.query(
    `UPDATE project_attempt_counters
     SET
       next_attempt_number = next_attempt_number + 1,
       updated_at = NOW()
     WHERE project_id = $1
     RETURNING (next_attempt_number - 1)::bigint AS attempt_number`,
    [project_id]
  );

  return Number(result.rows[0].attempt_number);
};

const findAttemptByIdempotencyKey = async (
  project_id,
  idempotency_key,
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT ${ATTEMPT_COLUMNS}
     FROM project_attempts
     WHERE project_id = $1
       AND idempotency_key = $2
     LIMIT 1`,
    [project_id, idempotency_key]
  );
  return result.rows[0] || null;
};

const createAttempt = async (
  {
    project_id,
    attempt_number,
    nodes_snapshot = [],
    edges_snapshot = [],
    evaluation_result,
    score = null,
    grade = null,
    passed = null,
    summary = {},
    issues = [],
    evaluation_engine_version,
    challenge_version_id = null,
    simulation_config = null,
    simulation_result = null,
    simulation_engine_version = null,
    idempotency_key,
  },
  client
) => {
  if (!client) {
    throw new Error("createAttempt requires a transaction client");
  }

  const result = await client.query(
    `INSERT INTO project_attempts (
       project_id,
       attempt_number,
       nodes_snapshot,
       edges_snapshot,
       evaluation_result,
       score,
       grade,
       passed,
       summary,
       issues,
       evaluation_engine_version,
       challenge_version_id,
       simulation_config,
       simulation_result,
       simulation_engine_version,
       idempotency_key
     )
     VALUES (
       $1, $2, $3::jsonb, $4::jsonb, $5::jsonb,
       $6, $7, $8, $9::jsonb, $10::jsonb,
       $11, $12, $13::jsonb, $14::jsonb, $15, $16
     )
     RETURNING ${ATTEMPT_COLUMNS}`,
    [
      project_id,
      attempt_number,
      JSON.stringify(nodes_snapshot),
      JSON.stringify(edges_snapshot),
      JSON.stringify(evaluation_result),
      score,
      grade,
      passed,
      JSON.stringify(summary),
      JSON.stringify(issues),
      evaluation_engine_version,
      challenge_version_id,
      simulation_config !== null && simulation_config !== undefined
        ? JSON.stringify(simulation_config)
        : null,
      simulation_result !== null && simulation_result !== undefined
        ? JSON.stringify(simulation_result)
        : null,
      simulation_engine_version ?? null,
      idempotency_key,
    ]
  );

  return result.rows[0];
};

const createAttemptRuleSnapshots = async (attempt_id, snapshots = [], client) => {
  if (!client) {
    throw new Error("createAttemptRuleSnapshots requires a transaction client");
  }

  const inserted = [];
  for (const snap of snapshots) {
    const result = await client.query(
      `INSERT INTO attempt_rule_snapshots (
         attempt_id,
         rule_id,
         rule_key,
         rule_version_id,
         rule_version_number,
         rule_type,
         is_enabled,
         config_snapshot,
         eval_params
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
       ON CONFLICT (attempt_id, rule_id) DO NOTHING
       RETURNING
         id,
         attempt_id,
         rule_id,
         rule_key,
         rule_version_id,
         rule_version_number,
         rule_type,
         is_enabled,
         config_snapshot,
         eval_params,
         created_at`,
      [
        attempt_id,
        snap.rule_id,
        snap.rule_key,
        snap.rule_version_id,
        snap.rule_version_number,
        snap.rule_type,
        Boolean(snap.is_enabled),
        JSON.stringify(snap.config_snapshot || {}),
        JSON.stringify(snap.eval_params || {}),
      ]
    );
    if (result.rows[0]) {
      inserted.push(result.rows[0]);
    }
  }

  return inserted;
};

const createActivityEvent = async (
  {
    user_id,
    project_id = null,
    attempt_id = null,
    event_type = "attempt_saved",
    timezone_at_event = "Asia/Kolkata",
    occurred_at = null,
  },
  client
) => {
  if (!client) {
    throw new Error("createActivityEvent requires a transaction client");
  }

  const safeTz = timezone_at_event || "Asia/Kolkata";
  const result = await client.query(
    `INSERT INTO activity_events (
       user_id,
       project_id,
       attempt_id,
       event_type,
       occurred_at,
       activity_date,
       timezone_at_event
     )
     VALUES (
       $1,
       $2,
       $3,
       $4,
       COALESCE($5::timestamptz, NOW()),
       (COALESCE($5::timestamptz, NOW()) AT TIME ZONE $6)::date,
       $6
     )
     RETURNING
       id,
       user_id,
       project_id,
       attempt_id,
       event_type,
       occurred_at,
       activity_date,
       timezone_at_event,
       created_at`,
    [user_id, project_id, attempt_id, event_type, occurred_at, safeTz]
  );

  return result.rows[0];
};

const findAttemptsByProjectId = async (
  { project_id, user_id, limit = 50, offset = 0 },
  client = null
) => {
  const executor = client || pool;

  const countResult = await executor.query(
    `SELECT COUNT(*)::int AS total
     FROM project_attempts pa
     JOIN user_projects up ON up.id = pa.project_id
     WHERE pa.project_id = $1
       AND up.user_id = $2`,
    [project_id, user_id]
  );

  const rowsResult = await executor.query(
    `SELECT
       pa.id,
       pa.project_id,
       pa.attempt_number,
       pa.score::float AS score,
       pa.grade,
       pa.passed,
       pa.summary,
       pa.issues,
       pa.evaluation_engine_version,
       pa.challenge_version_id,
       pa.simulation_engine_version,
       pa.saved_at,
       jsonb_array_length(COALESCE(pa.nodes_snapshot, '[]'::jsonb)) AS node_count,
       jsonb_array_length(COALESCE(pa.edges_snapshot, '[]'::jsonb)) AS edge_count
     FROM project_attempts pa
     JOIN user_projects up ON up.id = pa.project_id
     WHERE pa.project_id = $1
       AND up.user_id = $2
     ORDER BY pa.attempt_number DESC
     LIMIT $3 OFFSET $4`,
    [project_id, user_id, limit, offset]
  );

  return {
    items: rowsResult.rows,
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
};

const findAttemptById = async ({ attempt_id, user_id }, client = null) => {
  const executor = client || pool;
  const attemptResult = await executor.query(
    `SELECT
       pa.id,
       pa.project_id,
       pa.attempt_number,
       pa.nodes_snapshot,
       pa.edges_snapshot,
       pa.evaluation_result,
       pa.score::float AS score,
       pa.grade,
       pa.passed,
       pa.summary,
       pa.issues,
       pa.evaluation_engine_version,
       pa.challenge_version_id,
       pa.simulation_config,
       pa.simulation_result,
       pa.simulation_engine_version,
       pa.saved_at,
       up.user_id,
       up.project_mode,
       up.challenge_id,
       up.title AS project_title
     FROM project_attempts pa
     JOIN user_projects up ON up.id = pa.project_id
     WHERE pa.id = $1
       AND up.user_id = $2
     LIMIT 1`,
    [attempt_id, user_id]
  );

  const attempt = attemptResult.rows[0];
  if (!attempt) {
    return null;
  }

  const snapshotsResult = await executor.query(
    `SELECT
       id,
       attempt_id,
       rule_id,
       rule_key,
       rule_version_id,
       rule_version_number,
       rule_type,
       is_enabled,
       config_snapshot,
       eval_params,
       created_at
     FROM attempt_rule_snapshots
     WHERE attempt_id = $1
     ORDER BY rule_type ASC, rule_key ASC`,
    [attempt_id]
  );

  return {
    ...attempt,
    rule_snapshots: snapshotsResult.rows,
  };
};

const findLatestAttempt = async ({ project_id, user_id }, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT
       pa.id,
       pa.project_id,
       pa.attempt_number,
       pa.nodes_snapshot,
       pa.edges_snapshot,
       pa.evaluation_result,
       pa.score::float AS score,
       pa.grade,
       pa.passed,
       pa.summary,
       pa.issues,
       pa.evaluation_engine_version,
       pa.challenge_version_id,
       pa.simulation_config,
       pa.simulation_result,
       pa.simulation_engine_version,
       pa.saved_at
     FROM project_attempts pa
     JOIN user_projects up ON up.id = pa.project_id
     WHERE pa.project_id = $1
       AND up.user_id = $2
     ORDER BY pa.attempt_number DESC
     LIMIT 1`,
    [project_id, user_id]
  );
  return result.rows[0] || null;
};

const deleteAttempt = async ({ attempt_id, user_id }, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `DELETE FROM project_attempts pa
     USING user_projects up
     WHERE pa.id = $1
       AND pa.project_id = up.id
       AND up.user_id = $2
     RETURNING pa.id, pa.project_id, pa.attempt_number, pa.saved_at`,
    [attempt_id, user_id]
  );
  return result.rows[0] || null;
};

module.exports = {
  allocateAttemptNumber,
  findAttemptByIdempotencyKey,
  createAttempt,
  createAttemptRuleSnapshots,
  createActivityEvent,
  findAttemptsByProjectId,
  findAttemptById,
  findLatestAttempt,
  deleteAttempt,
};
