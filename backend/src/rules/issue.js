const crypto = require("crypto");
const { DEFAULT_PENALTY } = require("../types/ruleTypes");

/**
 * Every rule returns issues built with this helper so the API shape is uniform,
 * deterministic across runs, and compatible with attempt snapshots.
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
  const safeNodes = Array.isArray(nodeIds) ? nodeIds : [];
  const safeEdges = Array.isArray(edgeIds) ? edgeIds : [];

  const resolvedPenalty =
    typeof penalty === "number" && Number.isFinite(penalty)
      ? Math.max(0, penalty)
      : (DEFAULT_PENALTY[sev] ?? 0);

  const fingerprint = JSON.stringify({
    key,
    sev,
    title: title || "",
    message: message || "",
    nodeIds: safeNodes,
    edgeIds: safeEdges,
  });

  const digest = crypto
    .createHash("sha256")
    .update(fingerprint)
    .digest("hex")
    .slice(0, 12);

  return {
    id: `${key}-${digest}`,
    ruleId: key,
    rule_key: key,
    severity: sev,
    category: category || "structure",
    title,
    message,
    suggestion,
    nodeIds: safeNodes,
    edgeIds: safeEdges,
    penalty: resolvedPenalty,
  };
};

module.exports = { createIssue };