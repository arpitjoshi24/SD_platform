const {
  createUserProject,
  getUserProjects,
  getProjectById,
  getProjectSummary,
  getProjectAttemptsHistory,
  updateUserProject,
  deleteUserProject,
} = require("../services/project.service");
const { successResponse } = require("../utils/response");

// POST /projects
const createProject = async (req, res, next) => {
  try {
    const project = await createUserProject({
      user_id: req.user.id,
      project_mode: req.body.project_mode,
      challenge_id: req.body.challenge_id ?? null,
      title: req.body.title,
      selected_rules: req.body.selected_rules ?? [],
    });

    return successResponse(res, "Project created successfully", project, 201);
  } catch (err) {
    return next(err);
  }
};

// GET /projects
const getProjects = async (req, res, next) => {
  try {
    const mode = req.query?.mode || req.query?.project_mode || null;
    const projects = await getUserProjects(req.user.id, {
      project_mode: mode ? String(mode).trim().toLowerCase() : null,
    });

    return successResponse(res, "Projects fetched successfully", projects);
  } catch (err) {
    return next(err);
  }
};

// GET /projects/:id
const getProject = async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id, req.user.id);
    return successResponse(res, "Project fetched successfully", project);
  } catch (err) {
    return next(err);
  }
};

// GET /projects/:id/summary
const getProjectSummaryController = async (req, res, next) => {
  try {
    const summary = await getProjectSummary(req.params.id, req.user.id);
    return successResponse(res, "Project summary fetched successfully", summary);
  } catch (err) {
    return next(err);
  }
};

// GET /projects/:id/history
const getProjectHistoryController = async (req, res, next) => {
  try {
    const history = await getProjectAttemptsHistory(
      req.params.id,
      req.user.id,
      req.validatedQuery || req.query || {}
    );
    return successResponse(res, "Project attempt history fetched successfully", history);
  } catch (err) {
    return next(err);
  }
};

// PUT /projects/:id  (metadata / rename / status only; never writes nodes or edges)
const updateProjectController = async (req, res, next) => {
  try {
    const project = await updateUserProject({
      project_id: req.params.id,
      user_id: req.user.id,
      title: req.body.title,
      status: req.body.status,
    });

    return successResponse(res, "Project updated successfully", project);
  } catch (err) {
    return next(err);
  }
};

// DELETE /projects/:id
const deleteProjectController = async (req, res, next) => {
  try {
    const deleted = await deleteUserProject({
      project_id: req.params.id,
      user_id: req.user.id,
    });

    return successResponse(res, "Project deleted successfully", deleted);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  getProjectSummaryController,
  getProjectHistoryController,
  updateProjectController,
  deleteProjectController,
};