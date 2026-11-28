const { evaluateProject } = require("../services/validation.service");
const { successResponse } = require("../utils/response");

// POST /projects/:id/evaluate

const evaluate = async (req, res, next) => {
  try {
    // Support both accepted payload formats:
    // { snapshot: { nodes, edges } }
    // { nodes, edges }

    const rawSnapshot = req.body?.snapshot ?? req.body;

    if (
      !rawSnapshot ||
      !Array.isArray(rawSnapshot.nodes) ||
      !Array.isArray(rawSnapshot.edges)
    ) {
      const error = new Error("Invalid architecture snapshot");
      error.statusCode = 400;
      throw error;
    }

    const architectureInput = {
      nodes: rawSnapshot.nodes,
      edges: rawSnapshot.edges,
    };

    const result = await evaluateProject(
      req.params.id,
      req.user.id,
      architectureInput
    );

    return successResponse(
      res,
      "Architecture evaluated successfully",
      result
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = { evaluate };