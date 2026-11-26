const AppError = require("../utils/AppError");
const { findProjectById } = require("../repositories/project.repository");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Loads a project owned by req.user.id and enforces allowed project_mode if specified.
 * Repository queries must still filter by user_id as defense-in-depth.
 */
const attachOwnedProject = ({ allowedModes = null, paramNames = ["projectId", "id"] } = {}) => {
  const candidateKeys = Array.isArray(paramNames) ? paramNames : [paramNames];

  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Unauthorized. Please login.", 401);
      }

      const rawId = candidateKeys
        .map((key) => req.params?.[key])
        .find((val) => val !== undefined && val !== null && String(val).trim() !== "");

      if (!rawId || !UUID_REGEX.test(String(rawId).trim())) {
        throw new AppError("Invalid project identifier", 400);
      }

      const projectId = String(rawId).trim();
      const project = await findProjectById(projectId, req.user.id);

      if (!project) {
        throw new AppError("Project not found", 404);
      }

      if (Array.isArray(allowedModes) && allowedModes.length > 0) {
        if (!allowedModes.includes(project.project_mode)) {
          throw new AppError(
            `Operation is not valid for project mode '${project.project_mode}'`,
            400
          );
        }
      }

      req.project = project;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = { attachOwnedProject };