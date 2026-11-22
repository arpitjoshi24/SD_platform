const AppError = require("../utils/AppError");
const {
  createProject,
  findProjectsByUserId,
  findProjectById,
  updateProject,
} = require("../repositories/project.repository");
const { findChallengeById } = require("../repositories/challenge.repository");

const createUserProject = async ({ user_id, challenge_id, title }) => {
  const challenge = await findChallengeById(challenge_id);

  if (!challenge) {
    throw new AppError("Challenge not found", 404);
  }

  return createProject({ user_id, challenge_id, title });
};

const getUserProjects = async (user_id) => findProjectsByUserId(user_id);

const getProjectById = async (project_id, user_id) => {
  const project = await findProjectById(project_id, user_id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
};

const updateUserProject = async ({
  project_id,
  user_id,
  title,
  nodes,
  edges,
  status,
}) => {
  const project = await updateProject({
    project_id,
    user_id,
    title,
    nodes,
    edges,
    status,
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
};

module.exports = {
  createUserProject,
  getUserProjects,
  getProjectById,
  updateUserProject,
};
