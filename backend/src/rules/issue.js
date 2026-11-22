const { DEFAULT_PENALTY } = require("../types/ruleTypes");

let counter = 0;

/**
 * Every rule returns issues built with this helper so the API shape is uniform.
 */
const createIssue = ({
  ruleId,
  severity,
  category,
  title,
  message,
  suggestion = null,
  nodeIds = [],
  edgeIds = [],
  penalty,
}) => ({
  id: `${ruleId}-${++counter}`,
  ruleId,
  severity,
  category,
  title,
  message,
  suggestion,
  nodeIds,
  edgeIds,
  penalty: penalty ?? DEFAULT_PENALTY[severity] ?? 0,
});

module.exports = { createIssue };
