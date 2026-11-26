const {
  saveProjectAttempt,
  listProjectAttempts,
  getAttemptDetails,
  deleteUserAttempt,
} = require("../services/attempt.service");
const { successResponse } = require("../utils/response");

// POST /projects/:projectId/attempts
const saveAttemptController = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const snapshotInput = req.body.snapshot || {
      nodes: req.body.nodes || [],
      edges: req.body.edges || [],
    };

    const { attempt, idempotentReplay } = await saveProjectAttempt({
      project_id: projectId,
      user_id: req.user.id,
      user_timezone: req.user.timezone,
      idempotency_key: req.body.idempotency_key,
      snapshotInput,
      simulation_config: req.body.simulation_config ?? null,
      simulation_result: req.body.simulation_result ?? null,
      simulation_engine_version: req.body.simulation_engine_version ?? null,
    });

    return successResponse(
      res,
      idempotentReplay
        ? "Duplicate save ignored; returning existing saved attempt"
        : "Attempt saved successfully",
      attempt,
      idempotentReplay ? 200 : 201
    );
  } catch (err) {
    return next(err);
  }
};

// GET /projects/:projectId/attempts
const listAttemptsController = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const query = req.validatedQuery || req.query || {};
    const result = await listProjectAttempts({
      project_id: projectId,
      user_id: req.user.id,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });

    return successResponse(res, "Attempts fetched successfully", result);
  } catch (err) {
    return next(err);
  }
};

// GET /attempts/:attemptId
const getAttemptController = async (req, res, next) => {
  try {
    const attemptId = req.params.attemptId || req.params.id;
    const attempt = await getAttemptDetails({
      attempt_id: attemptId,
      user_id: req.user.id,
    });

    return successResponse(res, "Attempt fetched successfully", attempt);
  } catch (err) {
    return next(err);
  }
};

// DELETE /attempts/:attemptId
const deleteAttemptController = async (req, res, next) => {
  try {
    const attemptId = req.params.attemptId || req.params.id;
    const deleted = await deleteUserAttempt({
      attempt_id: attemptId,
      user_id: req.user.id,
    });

    return successResponse(res, "Attempt deleted successfully", deleted);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  saveAttemptController,
  listAttemptsController,
  getAttemptController,
  deleteAttemptController,
};