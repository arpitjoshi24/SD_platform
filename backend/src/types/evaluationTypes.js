const buildEvaluationContext = ({
  project_id,
  project_mode,
  challenge_id = null,
  challenge_version_id = null,
  architecture = { nodes: [], edges: [] },
  applicable_rules = [],
  evaluation_parameters = {},
}) => ({
  project_id,
  project_mode,
  challenge_id: project_mode === "challenge" ? challenge_id : null,
  challenge_version_id: project_mode === "challenge" ? challenge_version_id : null,
  architecture: {
    nodes: Array.isArray(architecture?.nodes) ? architecture.nodes : [],
    edges: Array.isArray(architecture?.edges) ? architecture.edges : [],
  },
  applicable_rules: Array.isArray(applicable_rules) ? applicable_rules : [],
  evaluation_parameters:
    evaluation_parameters && typeof evaluation_parameters === "object"
      ? evaluation_parameters
      : {},
});

module.exports = {
  buildEvaluationContext,
};