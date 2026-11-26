const AppError = require("../utils/AppError");
const { withTransaction } = require("../config/db");
const {
  findAllRules,
  findRuleById,
  findRuleByKey,
  findMandatoryRules,
  findPracticeAvailableGenericRules,
  findRuleVersions,
  createRule,
  updateRuleMetadata,
  createRuleVersion,
  findProjectRuleSelections,
  upsertProjectRuleSelections,
} = require("../repositories/rule.repository");
const { findChallengeRuleAssignments } = require("../repositories/challenge.repository");
const { findProjectById } = require("../repositories/project.repository");
const { hasRuleHandler } = require("../rules/ruleRegistry");

const listRules = async (filters = {}) => findAllRules(filters);

const getRuleById = async (rule_id) => {
  const rule = await findRuleById(rule_id);
  if (!rule) {
    throw new AppError("Rule not found", 404);
  }
  return rule;
};

const getRuleByKey = async (rule_key) => {
  const rule = await findRuleByKey(rule_key);
  if (!rule) {
    throw new AppError("Rule not found", 404);
  }
  return rule;
};

const getRuleVersions = async (rule_id) => {
  await getRuleById(rule_id);
  return findRuleVersions(rule_id);
};

const getPracticeAvailableRules = async () => findPracticeAvailableGenericRules();

const createRuleRecord = async (payload, actorId = null) => {
  if (!hasRuleHandler(payload.rule_key)) {
    throw new AppError(
      `Rule key '${payload.rule_key}' does not have a registered implementation in the Rule Engine`,
      400
    );
  }

  return withTransaction(async (client) => {
    const existing = await findRuleByKey(payload.rule_key, client);
    if (existing) {
      throw new AppError(`Rule with key '${payload.rule_key}' already exists`, 409);
    }

    const rule = await createRule(
      {
        rule_key: payload.rule_key,
        name: payload.name,
        description: payload.description,
        rule_type: payload.rule_type,
        category: payload.category,
        severity: payload.severity,
        applicability: payload.applicability || {},
        is_mandatory: Boolean(payload.is_mandatory),
        is_active: payload.is_active !== false,
        is_practice_available:
          payload.rule_type === "generic" ? Boolean(payload.is_practice_available) : false,
        current_version_number: 1,
      },
      client
    );

    const version = await createRuleVersion(
      {
        rule_id: rule.id,
        version_number: 1,
        config: payload.config || {},
        metadata_snapshot: {
          name: rule.name,
          category: rule.category,
          severity: rule.severity,
          is_mandatory: rule.is_mandatory,
        },
        created_by: actorId,
      },
      client
    );

    return { rule, version };
  });
};

const updateRuleRecord = async (rule_id, payload, actorId = null) => {
  return withTransaction(async (client) => {
    const existing = await findRuleById(rule_id, client);
    if (!existing) {
      throw new AppError("Rule not found", 404);
    }

    if (existing.is_mandatory && payload.is_active === false) {
      throw new AppError("Mandatory rules cannot be deactivated", 400);
    }

    let nextVersionNumber = existing.current_version_number;
    let createdVersion = null;

    if (payload.config !== undefined) {
      nextVersionNumber = Number(existing.current_version_number || 1) + 1;
      createdVersion = await createRuleVersion(
        {
          rule_id: existing.id,
          version_number: nextVersionNumber,
          config: payload.config || {},
          metadata_snapshot: {
            name: payload.name ?? existing.name,
            category: payload.category ?? existing.category,
            severity: payload.severity ?? existing.severity,
            is_mandatory: existing.is_mandatory,
          },
          created_by: actorId,
        },
        client
      );
    }

    const updatedRule = await updateRuleMetadata(
      {
        rule_id: existing.id,
        name: payload.name,
        description: payload.description,
        category: payload.category,
        severity: payload.severity,
        applicability: payload.applicability,
        is_active: payload.is_active,
        is_practice_available:
          existing.rule_type === "generic" ? payload.is_practice_available : false,
        current_version_number: nextVersionNumber,
      },
      client
    );

    return {
      rule: updatedRule,
      version: createdVersion,
    };
  });
};

const createNewRuleVersion = async (rule_id, payload, actorId = null) => {
  return withTransaction(async (client) => {
    const existing = await findRuleById(rule_id, client);
    if (!existing) {
      throw new AppError("Rule not found", 404);
    }

    const nextVersionNumber = Number(existing.current_version_number || 1) + 1;
    const version = await createRuleVersion(
      {
        rule_id: existing.id,
        version_number: nextVersionNumber,
        config: payload.config || {},
        metadata_snapshot: payload.metadata_snapshot || {
          name: existing.name,
          category: existing.category,
          severity: existing.severity,
          is_mandatory: existing.is_mandatory,
        },
        created_by: actorId,
      },
      client
    );

    const updatedRule = await updateRuleMetadata(
      {
        rule_id: existing.id,
        current_version_number: nextVersionNumber,
      },
      client
    );

    return { rule: updatedRule, version };
  });
};

const setPracticeRuleSelections = async (project_id, user_id, selections = []) => {
  const project = await findProjectById(project_id, user_id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }
  if (project.project_mode !== "practice") {
    throw new AppError(
      "User-controlled rule selection is only allowed for practice projects",
      400
    );
  }

  return withTransaction(async (client) => {
    const validated = [];
    for (const sel of selections) {
      const rule = await findRuleById(sel.rule_id, client);
      if (!rule) {
        throw new AppError(`Rule '${sel.rule_id}' not found`, 400);
      }
      if (rule.rule_type !== "generic" || !rule.is_active || !rule.is_practice_available) {
        throw new AppError(
          `Rule '${rule.rule_key}' is not selectable in practice mode`,
          400
        );
      }
      if (!rule.current_version_id) {
        throw new AppError(`Rule '${rule.rule_key}' has no active version`, 400);
      }

      validated.push({
        rule_id: rule.id,
        rule_version_id: rule.current_version_id,
        is_selected: rule.is_mandatory ? true : sel.is_selected !== false,
        config_override: sel.config_override || {},
      });
    }

    await upsertProjectRuleSelections(project_id, validated, client);
    return findProjectRuleSelections(project_id, client);
  });
};

/**
 * Resolves effective rules to execute + snapshot metadata for a project.
 */
const resolveApplicableRulesForProject = async (project, client = null) => {
  const mandatoryRules = await findMandatoryRules(client);
  const resolvedMap = new Map();

  for (const r of mandatoryRules) {
    if (!r.current_version_id) continue;
    resolvedMap.set(r.id, {
      rule_id: r.id,
      rule_key: r.rule_key,
      rule_version_id: r.current_version_id,
      rule_version_number: r.current_version_number,
      rule_type: r.rule_type,
      is_mandatory: true,
      is_enabled: true,
      config_snapshot: r.current_config || {},
      eval_params: {},
    });
  }

  if (project.project_mode === "challenge") {
    if (!project.challenge_version_id) {
      throw new AppError("Challenge project is missing challenge_version_id", 400);
    }

    const assignments = await findChallengeRuleAssignments(
      project.challenge_version_id,
      client
    );

    for (const a of assignments) {
      const isEnabled = a.is_mandatory ? true : Boolean(a.is_enabled);
      if (!isEnabled) continue;

      const mergedConfig = {
        ...(a.rule_version_config || {}),
        ...(a.config_override || {}),
      };

      resolvedMap.set(a.rule_id, {
        rule_id: a.rule_id,
        rule_key: a.rule_key,
        rule_version_id: a.rule_version_id,
        rule_version_number: a.rule_version_number,
        rule_type: a.rule_type,
        is_mandatory: Boolean(a.is_mandatory),
        is_enabled: true,
        config_snapshot: a.rule_version_config || {},
        eval_params: mergedConfig,
      });
    }
  } else if (project.project_mode === "practice") {
    const selections = await findProjectRuleSelections(project.id, client);

    for (const s of selections) {
      if (s.rule_type !== "generic" || !s.is_practice_available) {
        continue;
      }
      const isEnabled = s.is_mandatory ? true : Boolean(s.is_selected);
      if (!isEnabled) continue;

      const mergedConfig = {
        ...(s.rule_version_config || {}),
        ...(s.config_override || {}),
      };

      resolvedMap.set(s.rule_id, {
        rule_id: s.rule_id,
        rule_key: s.rule_key,
        rule_version_id: s.rule_version_id,
        rule_version_number: s.rule_version_number,
        rule_type: s.rule_type,
        is_mandatory: Boolean(s.is_mandatory),
        is_enabled: true,
        config_snapshot: s.rule_version_config || {},
        eval_params: mergedConfig,
      });
    }
  }

  return Array.from(resolvedMap.values());
};

module.exports = {
  listRules,
  getRuleById,
  getRuleByKey,
  getRuleVersions,
  getPracticeAvailableRules,
  createRuleRecord,
  updateRuleRecord,
  createNewRuleVersion,
  setPracticeRuleSelections,
  resolveApplicableRulesForProject,
};