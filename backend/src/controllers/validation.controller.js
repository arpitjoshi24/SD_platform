const { evaluateProject } = require("../services/validation.service");
const { successResponse } = require("../utils/response");

// POST /projects/:id/evaluate
const evaluate = async (req, res, next) => {
  try {
    const architectureInput = req.body?.snapshot || {
      nodes: req.body?.nodes || [],
      edges: req.body?.edges || [],
    };

    const result = await evaluateProject(
      req.params.id,
      req.user.id,
      architectureInput
    );

    return successResponse(res, "Architecture evaluated successfully", result);
  } catch (err) {
    return next(err);
  }
};

module.exports = { evaluate };