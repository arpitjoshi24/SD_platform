const { DEFAULT_PENALTY } = require("../types/ruleTypes");
const { PASSING_SCORE_THRESHOLD } = require("./constants");

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getIssuePenalty = (issue) => {
  if (typeof issue?.penalty === "number" && Number.isFinite(issue.penalty)) {
    return Math.max(0, issue.penalty);
  }
  const sev = String(issue?.severity || "warning").toLowerCase();
  return DEFAULT_PENALTY[sev] ?? 0;
};

const calculateScore = (issues = []) => {
  if (!Array.isArray(issues) || issues.length === 0) return 100;

  const seenIssueKeys = new Set();
  let totalPenalty = 0;

  for (const issue of issues) {
    if (!issue || typeof issue !== "object") continue;
    const dedupeKey = `${issue.rule_key || issue.ruleId || ""}:${issue.nodeId || issue.node_id || ""}:${issue.edgeId || issue.edge_id || ""}:${issue.message || ""}`;
    if (seenIssueKeys.has(dedupeKey)) continue;
    seenIssueKeys.add(dedupeKey);
    totalPenalty += getIssuePenalty(issue);
  }

  return clamp(100 - totalPenalty, 0, 100);
};

const getGrade = (score) => {
  const numeric = Number(score) || 0;
  if (numeric >= 90) return "A";
  if (numeric >= 75) return "B";
  if (numeric >= 60) return "C";
  if (numeric >= 40) return "D";
  return "F";
};

const isPassingScore = (score, issues = [], threshold = PASSING_SCORE_THRESHOLD) => {
  const hasBlockingError =
    Array.isArray(issues) &&
    issues.some((i) => {
      const sev = String(i?.severity || "").toLowerCase();
      return sev === "error" || sev === "critical";
    });
  return !hasBlockingError && Number(score) >= threshold;
};

module.exports = {
  getIssuePenalty,
  calculateScore,
  getGrade,
  isPassingScore,
};
