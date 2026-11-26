const SEVERITY = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
});

const CATEGORY = Object.freeze({
  STRUCTURE: "structure",
  CONNECTION: "connection",
  REQUIREMENT: "requirement",
  RELIABILITY: "reliability",
  PERFORMANCE: "performance",
  SECURITY: "security",
  DATA_INTEGRITY: "data_integrity",
});

const RULE_TYPE = Object.freeze({
  GENERIC: "generic",
  CHALLENGE_SPECIFIC: "challenge_specific",
});

const EXECUTION_MODE = Object.freeze({
  MANDATORY: "mandatory",
  OPTIONAL: "optional",
});

const DEFAULT_PENALTY = Object.freeze({
  info: 0,
  warning: 5,
  error: 15,
  critical: 25,
});

module.exports = {
  SEVERITY,
  CATEGORY,
  RULE_TYPE,
  EXECUTION_MODE,
  DEFAULT_PENALTY,
};