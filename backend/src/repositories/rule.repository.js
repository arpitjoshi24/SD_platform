const { pool } = require("../config/db");

const RULE_COLUMNS = `
  r.id,
  r.rule_key,
  r.name,
  r.description,
  r.rule_type,
  r.category,
  r.severity,
  r.applicability,
  r.is_mandatory,
  r.is_active,
  r.is_practice_available,
  r.current_version_number,
  r.created_at,
  r.updated_at
`;

const findAllRules = async (
  {
    rule_type = null,
    category = null,
    is_active = null,
    is_practice_available = null,
    search = null,
  } = {},
  client = null
) => {
  const executor = client || pool;
  const values = [];
  const conditions = [];

  if (rule_type) {
    values.push(rule_type);
    conditions.push(`r.rule_type = $${values.length}`);
  }
  if (category) {
    values.push(category);
    conditions.push(`r.category = $${values.length}`);
  }
  if (typeof is_active === "boolean") {
    values.push(is_active);
    conditions.push(`r.is_active = $${values.length}`);
  }
  if (typeof is_practice_available === "boolean") {
    values.push(is_practice_available);
    conditions.push(`r.is_practice_available = $${values.length}`);
  }
  if (search && String(search).trim() !== "") {
    values.push(`%${String(search).trim()}%`);
    conditions.push(
      `(r.rule_key ILIKE $${values.length} OR r.name ILIKE $${values.length} OR r.description ILIKE $${values.length})`
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await executor.query(
    `SELECT
       ${RULE_COLUMNS},
       rv.id AS current_version_id,
       rv.config AS current_config
     FROM rules r
     LEFT JOIN rule_versions rv
       ON rv.rule_id = r.id
      AND rv.version_number = r.current_version_number
     ${whereClause}
     ORDER BY r.rule_type ASC, r.is_mandatory DESC, r.rule_key ASC`,
    values
  );

  return result.rows;
};

const findRuleById = async (rule_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT
       ${RULE_COLUMNS},
       rv.id AS current_version_id,
       rv.config AS current_config
     FROM rules r
     LEFT JOIN rule_versions rv
       ON rv.rule_id = r.id
      AND rv.version_number = r.current_version_number
     WHERE r.id = $1
     LIMIT 1`,
    [rule_id]
  );
  return result.rows[0] || null;
};

const findRuleByKey = async (rule_key, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT
       ${RULE_COLUMNS},
       rv.id AS current_version_id,
       rv.config AS current_config
     FROM rules r
     LEFT JOIN rule_versions rv
       ON rv.rule_id = r.id
      AND rv.version_number = r.current_version_number
     WHERE r.rule_key = $1
     LIMIT 1`,
    [rule_key]
  );
  return result.rows[0] || null;
};

const findActiveRulesByType = async (rule_type, client = null) =>
  findAllRules({ rule_type, is_active: true }, client);

const findPracticeAvailableGenericRules = async (client = null) =>
  findAllRules(
    {
      rule_type: "generic",
      is_active: true,
      is_practice_available: true,
    },
    client
  );

const findMandatoryRules = async (client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT
       ${RULE_COLUMNS},
       rv.id AS current_version_id,
       rv.config AS current_config
     FROM rules r
     LEFT JOIN rule_versions rv
       ON rv.rule_id = r.id
      AND rv.version_number = r.current_version_number
     WHERE r.is_mandatory = TRUE
       AND r.is_active = TRUE
     ORDER BY r.rule_key ASC`
  );
  return result.rows;
};

const findRuleVersions = async (rule_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT id, rule_id, version_number, config, metadata_snapshot, created_by, created_at
     FROM rule_versions
     WHERE rule_id = $1
     ORDER BY version_number DESC`,
    [rule_id]
  );
  return result.rows;
};

const findRuleVersionById = async (rule_version_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT id, rule_id, version_number, config, metadata_snapshot, created_by, created_at
     FROM rule_versions
     WHERE id = $1
     LIMIT 1`,
    [rule_version_id]
  );
  return result.rows[0] || null;
};

const createRule = async (
  {
    rule_key,
    name,
    description,
    rule_type,
    category,
    severity = "warning",
    applicability = {},
    is_mandatory = false,
    is_active = true,
    is_practice_available = false,
    current_version_number = 1,
  },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `INSERT INTO rules (
       rule_key,
       name,
       description,
       rule_type,
       category,
       severity,
       applicability,
       is_mandatory,
       is_active,
       is_practice_available,
       current_version_number
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)
     RETURNING
       id,
       rule_key,
       name,
       description,
       rule_type,
       category,
       severity,
       applicability,
       is_mandatory,
       is_active,
       is_practice_available,
       current_version_number,
       created_at,
       updated_at`,
    [
      rule_key,
      name,
      description,
      rule_type,
      category,
      severity,
      JSON.stringify(applicability),
      Boolean(is_mandatory),
      Boolean(is_active),
      Boolean(is_practice_available),
      current_version_number,
    ]
  );
  return result.rows[0];
};

const updateRuleMetadata = async (
  {
    rule_id,
    name,
    description,
    category,
    severity,
    applicability,
    is_active,
    is_practice_available,
    current_version_number,
  },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `UPDATE rules
     SET
       name = COALESCE($2, name),
       description = COALESCE($3, description),
       category = COALESCE($4, category),
       severity = COALESCE($5, severity),
       applicability = COALESCE($6::jsonb, applicability),
       is_active = COALESCE($7, is_active),
       is_practice_available = COALESCE($8, is_practice_available),
       current_version_number = COALESCE($9, current_version_number),
       updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       rule_key,
       name,
       description,
       rule_type,
       category,
       severity,
       applicability,
       is_mandatory,
       is_active,
       is_practice_available,
       current_version_number,
       created_at,
       updated_at`,
    [
      rule_id,
      name ?? null,
      description ?? null,
      category ?? null,
      severity ?? null,
      applicability !== undefined ? JSON.stringify(applicability) : null,
      is_active !== undefined ? Boolean(is_active) : null,
      is_practice_available !== undefined ? Boolean(is_practice_available) : null,
      current_version_number ?? null,
    ]
  );
  return result.rows[0] || null;
};

const createRuleVersion = async (
  {
    rule_id,
    version_number,
    config = {},
    metadata_snapshot = {},
    created_by = null,
  },
  client = null
) => {
  const executor = client || pool;
  const result = await executor.query(
    `INSERT INTO rule_versions (
       rule_id,
       version_number,
       config,
       metadata_snapshot,
       created_by
     )
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)
     RETURNING id, rule_id, version_number, config, metadata_snapshot, created_by, created_at`,
    [
      rule_id,
      version_number,
      JSON.stringify(config),
      JSON.stringify(metadata_snapshot),
      created_by,
    ]
  );
  return result.rows[0];
};

const findProjectRuleSelections = async (project_id, client = null) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT
       prs.id,
       prs.project_id,
       prs.rule_id,
       prs.rule_version_id,
       prs.is_selected,
       prs.config_override,
       prs.created_at,
       prs.updated_at,
       r.rule_key,
       r.name,
       r.description,
       r.rule_type,
       r.category,
       r.severity,
       r.is_mandatory,
       r.is_active,
       r.is_practice_available,
       rv.version_number AS rule_version_number,
       rv.config AS rule_version_config
     FROM project_rule_selections prs
     JOIN rules r ON r.id = prs.rule_id
     JOIN rule_versions rv ON rv.id = prs.rule_version_id
     WHERE prs.project_id = $1
     ORDER BY r.rule_key ASC`,
    [project_id]
  );
  return result.rows;
};

const upsertProjectRuleSelections = async (
  project_id,
  selections = [],
  client = null
) => {
  const executor = client || pool;
  const saved = [];

  for (const sel of selections) {
    const result = await executor.query(
      `INSERT INTO project_rule_selections (
         project_id,
         rule_id,
         rule_version_id,
         is_selected,
         config_override
       )
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (project_id, rule_id)
       DO UPDATE SET
         rule_version_id = EXCLUDED.rule_version_id,
         is_selected = EXCLUDED.is_selected,
         config_override = EXCLUDED.config_override,
         updated_at = NOW()
       RETURNING
         id,
         project_id,
         rule_id,
         rule_version_id,
         is_selected,
         config_override,
         created_at,
         updated_at`,
      [
        project_id,
        sel.rule_id,
        sel.rule_version_id,
        sel.is_selected !== undefined ? Boolean(sel.is_selected) : true,
        JSON.stringify(sel.config_override || {}),
      ]
    );
    saved.push(result.rows[0]);
  }

  return saved;
};

module.exports = {
  findAllRules,
  findRuleById,
  findRuleByKey,
  findActiveRulesByType,
  findPracticeAvailableGenericRules,
  findMandatoryRules,
  findRuleVersions,
  findRuleVersionById,
  createRule,
  updateRuleMetadata,
  createRuleVersion,
  findProjectRuleSelections,
  upsertProjectRuleSelections,
};
