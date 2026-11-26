const AppError = require("../utils/AppError");
const { PROJECT_MODES, PROJECT_STATUSES } = require("../utils/constants");
const { withTransaction } = require("../config/db");
const {
  createProject,
  findProjectsByUserId,
  findProjectById,
  updateProjectTitle,
  updateProjectStatus,
  findProjectWithLatestAttempt,
  deleteProject,
} = require("../repositories/project.repository");
const {
  findChallengeById,
  findChallengeCurrentVersion,
} = require("../repositories/challenge.repository");
const {
  findRuleById,
  upsertProjectRuleSelections,
  findProjectRuleSelections,
} = require("../repositories/rule.repository");
const { findAttemptsByProjectId } = require("../repositories/attempt.repository");

const createUserProject = async ({
  user_id,
  project_mode = PROJECT_MODES.CHALLENGE,
  challenge_id = null,
  title,
  selected_rules = [],
}) => {
  const mode = String(project_mode || PROJECT_MODES.CHALLENGE).toLowerCase();

  if (mode !== PROJECT_MODES.CHALLENGE && mode !== PROJECT_MODES.PRACTICE) {
    throw new AppError("Invalid project_mode. Must be 'challenge' or 'practice'", 400);
  }

  if (mode === PROJECT_MODES.CHALLENGE) {
    if (!challenge_id) {
      throw new AppError("challenge_id is required for challenge projects", 400);
    }

    const challenge = await findChallengeById(challenge_id, { includeUnpublished: false });
    if (!challenge) {
      throw new AppError("Published challenge not found", 404);
    }

    const currentVersion = await findChallengeCurrentVersion(challenge.id);
    if (!currentVersion) {
      throw new AppError("Challenge has no active version configured", 400);
    }

    const finalTitle =
      title && String(title).trim().length > 0
        ? String(title).trim()
        : `${challenge.title} — Architecture`;

    return createProject({
      user_id,
      title: finalTitle,
      project_mode: PROJECT_MODES.CHALLENGE,
      challenge_id: challenge.id,
      challenge_version_id: currentVersion.id,
      status: PROJECT_STATUSES.IN_PROGRESS,
    });
  }

  // Practice mode ("Try Your Own")
  if (challenge_id) {
    throw new AppError("Practice projects cannot be linked to a challenge", 400);
  }

  const finalTitle =
    title && String(title).trim().length > 0
      ? String(title).trim()
      : "Untitled Practice Architecture";

  return withTransaction(async (client) => {
    const project = await createProject(
      {
        user_id,
        title: finalTitle,
        project_mode: PROJECT_MODES.PRACTICE,
        challenge_id: null,
        challenge_version_id: null,
        status: PROJECT_STATUSES.IN_PROGRESS,
      },
      client
    );

    if (Array.isArray(selected_rules) && selected_rules.length > 0) {
      const validated = [];
      for (const item of selected_rules) {
        const rule = await findRuleById(item.rule_id, client);
        if (!rule) {
          throw new AppError(`Rule '${item.rule_id}' not found`, 400);
        }
        if (rule.rule_type !== "generic" || !rule.is_active || !rule.is_practice_available) {
          throw new AppError(
            `Rule '${rule.rule_key}' is not available for practice projects`,
            400
          );
        }
        if (!rule.current_version_id) {
          throw new AppError(`Rule '${rule.rule_key}' has no active version`, 400);
        }

        validated.push({
          rule_id: rule.id,
          rule_version_id: rule.current_version_id,
          is_selected: rule.is_mandatory ? true : item.is_selected !== false,
          config_override: item.config_override || {},
        });
      }

      await upsertProjectRuleSelections(project.id, validated, client);
    }

    return project;
  });
};

const getUserProjects = async (user_id, filters = {}) =>
  findProjectsByUserId(user_id, filters);

const getProjectById = async (project_id, user_id) => {
  const project = await findProjectById(project_id, user_id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const rule_selections =
    project.project_mode === PROJECT_MODES.PRACTICE
      ? await findProjectRuleSelections(project.id)
      : [];

  return {
    ...project,
    rule_selections,
  };
};

const getProjectSummary = async (project_id, user_id) => {
  const summary = await findProjectWithLatestAttempt(project_id, user_id);
  if (!summary) {
    throw new AppError("Project not found", 404);
  }
  return summary;
};

const getProjectAttemptsHistory = async (project_id, user_id, query = {}) => {
  const project = await findProjectById(project_id, user_id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }
  return findAttemptsByProjectId({
    project_id,
    user_id,
    limit: query.limit ?? 50,
    offset: query.offset ?? 0,
  });
};

const updateUserProject = async ({ project_id, user_id, title, status }) => {
  const existing = await findProjectById(project_id, user_id);
  if (!existing) {
    throw new AppError("Project not found", 404);
  }

  let updated = existing;
  if (title !== undefined) {
    updated = await updateProjectTitle({ project_id, user_id, title: String(title).trim() });
  }
  if (status !== undefined) {
    updated = await updateProjectStatus({ project_id, user_id, status });
  }

  return updated;
};

const deleteUserProject = async ({ project_id, user_id }) => {
  const existing = await findProjectById(project_id, user_id);
  if (!existing) {
    throw new AppError("Project not found", 404);
  }

  const summary = await findProjectWithLatestAttempt(project_id, user_id);
  if ((summary?.total_attempts || 0) > 0) {
    throw new AppError(
      "Cannot permanently delete a project that has saved attempts. Archive it instead.",
      409
    );
  }

  const deleted = await deleteProject({ project_id, user_id });
  if (!deleted) {
    throw new AppError("Project not found", 404);
  }
  return deleted;
};

module.exports = {
  createUserProject,
  getUserProjects,
  getProjectById,
  getProjectSummary,
  getProjectAttemptsHistory,
  updateUserProject,
  deleteUserProject,
};