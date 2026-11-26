const { DEFAULT_PENALTY } = require("../types/ruleTypes");

let counter = 0;

/**
 * Every rule returns issues built with this helper so the API shape is uniform
 * and compatible with attempt snapshots.
 */
const createIssue = ({
  ruleId,
  ruleKey,
  severity,
  category,
  title,
  message,
  suggestion = null,
  nodeIds = [],
  edgeIds = [],
  penalty,
}) => {
  const key = ruleKey || ruleId;
  const sev = severity || "warning";
  const resolvedPenalty =
    typeof penalty === "number" && Number.isFinite(penalty)
      ? Math.max(0, penalty)
      : (DEFAULT_PENALTY[sev] ?? 0);

  return {
    id: `${key}-${++counter}`,
    ruleId: key,
    rule_key: key,
    severity: sev,
    category: category || "structure",
    title,
    message,
    suggestion,
    nodeIds: Array.isArray(nodeIds) ? nodeIds : [],
    edgeIds: Array.isArray(edgeIds) ? edgeIds : [],
    penalty: resolvedPenalty,
  };
};

module.exports = { createIssue };
