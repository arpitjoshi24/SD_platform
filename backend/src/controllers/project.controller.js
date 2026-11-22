const {
  createUserProject,
  getUserProjects,
  getProjectById,
  updateUserProject,
} = require("../services/project.service");
const { successResponse } = require("../utils/response");

// POST /projects
const createProject = async (req, res) => {
  const project = await createUserProject({
    user_id: req.user.id,
    challenge_id: req.body.challenge_id,
    title: req.body.title,
  });

  return successResponse(res, "Project created successfully", project, 201);
};

// GET /projects
const getProjects = async (req, res) => {
  const projects = await getUserProjects(req.user.id);

  return successResponse(res, "Projects fetched successfully", projects);
};

// GET /projects/:id
const getProject = async (req, res) => {
  const project = await getProjectById(req.params.id, req.user.id);

  return successResponse(res, "Project fetched successfully", project);
};

// PUT /projects/:id
const updateProjectController = async (req, res) => {
  const project = await updateUserProject({
    project_id: req.params.id,
    user_id: req.user.id,
    ...req.body,
  });

  return successResponse(res, "Project updated successfully", project);
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProjectController,
};
