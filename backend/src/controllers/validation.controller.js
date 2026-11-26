const { evaluateProject } = require("../services/validation.service");
const { successResponse } = require("../utils/response");

// POST /projects/:id/evaluate
const evaluate = async (req, res, next) => {
  try {
    const rawSnapshot =
      req.body?.snapshot && typeof req.body.snapshot === "object"
        ? req.body.snapshot
        : req.body;

    const architectureInput = {
      nodes: Array.isArray(rawSnapshot?.nodes) ? rawSnapshot.nodes : [],
      edges: Array.isArray(rawSnapshot?.edges) ? rawSnapshot.edges : [],
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