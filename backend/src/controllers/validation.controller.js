const { evaluateProject } = require("../services/validation.service");
const { successResponse } = require("../utils/response");

// POST /projects/:id/evaluate
const evaluate = async (req, res) => {
  const result = await evaluateProject(req.params.id, req.user.id);

  return successResponse(res, "Architecture evaluated successfully", result);
};

module.exports = { evaluate };
