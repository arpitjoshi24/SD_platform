const AppError = require("../utils/AppError");
const { slugify } = require("../utils/helpers");
const { withTransaction } = require("../config/db");
const {
  findAllPublishedChallenges,
  findAllChallengesForAdmin,
  findChallengeById,
  findChallengeBySlug,
  findChallengeCurrentVersion,
  findChallengeVersionById,
  createChallenge,
  updateChallenge,
  archiveChallenge,
  restoreChallenge,
  deleteChallengePermanently,
  createChallengeVersion,
  createChallengeRuleAssignments,
  findChallengeRuleAssignments,
  findChallengeStatistics,
  findChallengeParticipants,
  findChallengeEvaluationContext,
} = require("../repositories/challenge.repository");
const {
  findRuleById,
  findRuleVersionById,
} = require("../repositories/rule.repository");
const { hasRuleHandler } = require("../rules/ruleRegistry");

const getAllChallenges = async () => findAllPublishedChallenges();

const getChallengeById = async (id, { includeUnpublished = false } = {}) => {
  const challenge = await findChallengeById(id, { includeUnpublished });
  if (!challenge) {
    throw new AppError("Challenge not found", 404);
  }
  return challenge;
};

const getChallengeBySlug = async (slug, { includeUnpublished = false } = {}) => {
  const challenge = await findChallengeBySlug(slug, { includeUnpublished });
  if (!challenge) {
    throw new AppError("Challenge not found", 404);
  }
  return challenge;
};

const resolveChallengeVersion = async (challenge_id, challenge_version_id = null) => {
  const challenge = await findChallengeById(challenge_id, { includeUnpublished: true });
  if (!challenge) {
    throw new AppError("Challenge not found", 404);
  }

  const version = challenge_version_id
    ? await findChallengeVersionById(challenge_version_id)
    : await findChallengeCurrentVersion(challenge_id);

  if (!version || version.challenge_id !== challenge_id) {
    throw new AppError("Challenge version not found", 404);
  }

  return { challenge, version };
};

const resolveAndValidateAssignments = async (assignments = [], client) => {
  const resolved = [];

  for (const item of assignments) {
    const rule = await findRuleById(item.rule_id, client);
    if (!rule) {
      throw new AppError(`Rule '${item.rule_id}' not found`, 400);
    }
    if (!rule.is_active) {
      throw new AppError(`Rule '${rule.rule_key}' is inactive and cannot be assigned`, 400);
    }
    if (!hasRuleHandler(rule.rule_key)) {
      throw new AppError(`Rule '${rule.rule_key}' is not registered in the Rule Engine`, 400);
    }

    let targetVersionId = item.rule_version_id || rule.current_version_number ? rule.current_version_id : null;
    if (item.rule_version_id) {
      const ver = await findRuleVersionById(item.rule_version_id, client);
      if (!ver || ver.rule_id !== rule.id) {
        throw new AppError(`Invalid rule_version_id '${item.rule_version_id}' for rule '${rule.rule_key}'`, 400);
      }
      targetVersionId = ver.id;
    }

    if (!targetVersionId) {
      throw new AppError(`No rule version available for rule '${rule.rule_key}'`, 400);
    }

    const isEnabled = rule.is_mandatory ? true : item.is_enabled !== false;

    resolved.push({
      rule_id: rule.id,
      rule_version_id: targetVersionId,
      is_enabled: isEnabled,
      config_override: item.config_override || {},
    });
  }

  return resolved;
};

const createChallengeWithVersion = async (payload, actorId = null) => {
  return withTransaction(async (client) => {
    const baseSlug = payload.slug || slugify(payload.title);
    if (!baseSlug) {
      throw new AppError("Valid challenge title or slug is required", 400);
    }

    const existingSlug = await findChallengeBySlug(baseSlug, { includeUnpublished: true }, client);
    if (existingSlug) {
      throw new AppError("A challenge with this slug already exists", 409);
    }

    const challenge = await createChallenge(
      {
        title: payload.title,
        slug: baseSlug,
        description: payload.description,
        difficulty: payload.difficulty,
        category: payload.category ?? null,
        estimated_minutes: payload.estimated_minutes ?? null,
        requirements: payload.requirements ?? [],
        hints: payload.hints ?? [],
        is_published: Boolean(payload.is_published),
        is_archived: false,
        current_version_number: 1,
        created_by: actorId,
      },
      client
    );

    const version = await createChallengeVersion(
      {
        challenge_id: challenge.id,
        version_number: 1,
        snapshot_config: payload.evaluation_config || {},
        created_by: actorId,
      },
      client
    );

    const assignments = await resolveAndValidateAssignments(
      payload.rule_assignments || [],
      client
    );
    const savedAssignments = await createChallengeRuleAssignments(
      version.id,
      assignments,
      client
    );

    return {
      challenge,
      version,
      rule_assignments: savedAssignments,
    };
  });
};

const updateChallengeAndCreateVersion = async (challenge_id, payload, actorId = null) => {
  return withTransaction(async (client) => {
    const existing = await findChallengeById(challenge_id, { includeUnpublished: true }, client);
    if (!existing) {
      throw new AppError("Challenge not found", 404);
    }

    if (payload.slug && payload.slug !== existing.slug) {
      const slugOwner = await findChallengeBySlug(payload.slug, { includeUnpublished: true }, client);
      if (slugOwner && slugOwner.id !== challenge_id) {
        throw new AppError("A challenge with this slug already exists", 409);
      }
    }

    const nextVersionNumber = Number(existing.current_version_number || 1) + 1;
    const currentVersion = await findChallengeCurrentVersion(challenge_id, client);

    const updatedChallenge = await updateChallenge(
      {
        challenge_id,
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        difficulty: payload.difficulty,
        category: payload.category,
        estimated_minutes: payload.estimated_minutes,
        requirements: payload.requirements,
        hints: payload.hints,
        is_published: payload.is_published,
        current_version_number: nextVersionNumber,
      },
      client
    );

    const nextSnapshotConfig =
      payload.evaluation_config !== undefined
        ? payload.evaluation_config
        : (currentVersion?.snapshot_config || {});

    const newVersion = await createChallengeVersion(
      {
        challenge_id,
        version_number: nextVersionNumber,
        snapshot_config: nextSnapshotConfig,
        created_by: actorId,
      },
      client
    );

    let assignmentsToCopy = [];
    if (Array.isArray(payload.rule_assignments)) {
      assignmentsToCopy = await resolveAndValidateAssignments(payload.rule_assignments, client);
    } else if (currentVersion) {
      const prevAssignments = await findChallengeRuleAssignments(currentVersion.id, client);
      assignmentsToCopy = prevAssignments.map((a) => ({
        rule_id: a.rule_id,
        rule_version_id: a.rule_version_id,
        is_enabled: a.is_enabled,
        config_override: a.config_override || {},
      }));
    }

    const savedAssignments = await createChallengeRuleAssignments(
      newVersion.id,
      assignmentsToCopy,
      client
    );

    return {
      challenge: updatedChallenge,
      version: newVersion,
      rule_assignments: savedAssignments,
    };
  });
};

module.exports = {
  getAllChallenges,
  getChallengeById,
  getChallengeBySlug,
  resolveChallengeVersion,
  createChallengeWithVersion,
  updateChallengeAndCreateVersion,
  findAllChallengesForAdmin,
  archiveChallenge,
  restoreChallenge,
  deleteChallengePermanently,
  findChallengeStatistics,
  findChallengeParticipants,
  findChallengeEvaluationContext,
};