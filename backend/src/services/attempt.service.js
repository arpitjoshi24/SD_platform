const AppError = require("../utils/AppError");
const {
  EVALUATION_ENGINE_VERSION,
  PROJECT_MODES,
  PROJECT_STATUSES,
  DEFAULT_TIMEZONE,
} = require("../utils/constants");
const { isValidTimeZone } = require("../utils/helpers");
const { normalizeArchitectureSnapshot } = require("../types/nodeTypes");
const { withTransaction } = require("../config/db");
const {
  findProjectById,
  findProjectChallengeVersion,
  updateProjectStatus,
} = require("../repositories/project.repository");
const {
  allocateAttemptNumber,
  findAttemptByIdempotencyKey,
  createAttempt,
  createAttemptRuleSnapshots,
  createActivityEvent,
  findAttemptsByProjectId,
  findAttemptById,
  deleteAttempt,
} = require("../repositories/attempt.repository");
const { resolveApplicableRulesForProject } = require("./rule.service");
const { evaluateArchitecture } = require("./validation.service");

const saveProjectAttempt = async ({
  project_id,
  user_id,
  user_timezone = DEFAULT_TIMEZONE,
  idempotency_key,
  snapshotInput,
  simulation_config = null,
  simulation_result = null,
  simulation_engine_version = null,
}) => {
  if (!idempotency_key) {
    throw new AppError("idempotency_key is required to save an attempt", 400);
  }

  const project = await findProjectById(project_id, user_id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  let challengeSnapshotConfig = {};
  let challengeVersionId = null;

  if (project.project_mode === PROJECT_MODES.CHALLENGE) {
    const versionInfo = await findProjectChallengeVersion(project_id, user_id);
    if (!versionInfo || !versionInfo.challenge_version_id) {
      throw new AppError("Challenge version not found for challenge project", 404);
    }
    challengeSnapshotConfig = versionInfo.snapshot_config || {};
    challengeVersionId = versionInfo.challenge_version_id;
  }

  const normalizedSnapshot = normalizeArchitectureSnapshot(snapshotInput || {});
  const resolvedRules = await resolveApplicableRulesForProject(project);

  const evaluation = evaluateArchitecture({
    nodes: normalizedSnapshot.nodes,
    edges: normalizedSnapshot.edges,
    resolvedRules,
    challengeSnapshotConfig,
  });

  const safeTz = isValidTimeZone(user_timezone) ? user_timezone.trim() : DEFAULT_TIMEZONE;

  return withTransaction(async (client) => {
    const existingByKey = await findAttemptByIdempotencyKey(
      project_id,
      idempotency_key,
      client
    );
    if (existingByKey) {
      return {
        attempt: existingByKey,
        idempotentReplay: true,
      };
    }

    const attemptNumber = await allocateAttemptNumber(project_id, client);

    const attempt = await createAttempt(
      {
        project_id,
        attempt_number: attemptNumber,
        nodes_snapshot: normalizedSnapshot.nodes,
        edges_snapshot: normalizedSnapshot.edges,
        evaluation_result: evaluation,
        score: evaluation.score,
        grade: evaluation.grade,
        passed: evaluation.passed,
        summary: evaluation.summary,
        issues: evaluation.issues,
        evaluation_engine_version: EVALUATION_ENGINE_VERSION,
        challenge_version_id: challengeVersionId,
        simulation_config,
        simulation_result,
        simulation_engine_version,
        idempotency_key,
      },
      client
    );

    const ruleSnapshots = await createAttemptRuleSnapshots(
      attempt.id,
      resolvedRules,
      client
    );

    await createActivityEvent(
      {
        user_id,
        project_id,
        attempt_id: attempt.id,
        event_type: "attempt_saved",
        timezone_at_event: safeTz,
      },
      client
    );

    if (
      project.project_mode === PROJECT_MODES.CHALLENGE &&
      evaluation.passed &&
      project.status === PROJECT_STATUSES.IN_PROGRESS
    ) {
      await updateProjectStatus(
        {
          project_id,
          user_id,
          status: PROJECT_STATUSES.COMPLETED,
        },
        client
      );
    }

    return {
      attempt: {
        ...attempt,
        rule_snapshots: ruleSnapshots,
      },
      idempotentReplay: false,
    };
  });
};

const listProjectAttempts = async ({ project_id, user_id, limit = 50, offset = 0 }) => {
  const project = await findProjectById(project_id, user_id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }
  return findAttemptsByProjectId({ project_id, user_id, limit, offset });
};

const getAttemptDetails = async ({ attempt_id, user_id }) => {
  const attempt = await findAttemptById({ attempt_id, user_id });
  if (!attempt) {
    throw new AppError("Attempt not found", 404);
  }
  return attempt;
};

const deleteUserAttempt = async ({ attempt_id, user_id }) => {
  const deleted = await deleteAttempt({ attempt_id, user_id });
  if (!deleted) {
    throw new AppError("Attempt not found", 404);
  }
  return deleted;
};

module.exports = {
  saveProjectAttempt,
  listProjectAttempts,
  getAttemptDetails,
  deleteUserAttempt,
};