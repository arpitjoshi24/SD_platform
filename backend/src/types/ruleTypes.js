const SEVERITY = Object.freeze({
  ERROR: "error", // design is wrong / incomplete -> blocks "passed"
  WARNING: "warning", // works, but a weakness
  INFO: "info", // educational note, no penalty
});

const CATEGORY = Object.freeze({
  STRUCTURE: "structure",
  CONNECTION: "connection",
  REQUIREMENT: "requirement",
  RELIABILITY: "reliability",
  PERFORMANCE: "performance",
});

// Default score penalty per issue (a rule can override it)
const DEFAULT_PENALTY = Object.freeze({
  error: 15,
  warning: 5,
  info: 0,
});

module.exports = { SEVERITY, CATEGORY, DEFAULT_PENALTY };
