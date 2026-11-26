const API_VERSION = "v1";
const EVALUATION_ENGINE_VERSION = "1.0.0";
const SIMULATION_ENGINE_VERSION = "1.0.0";
const PASSING_SCORE_THRESHOLD = 70;
const DEFAULT_TIMEZONE = "Asia/Kolkata";

const ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
});

const ACCOUNT_STATUSES = Object.freeze({
  ACTIVE: "active",
  SUSPENDED: "suspended",
});

const PROJECT_MODES = Object.freeze({
  CHALLENGE: "challenge",
  PRACTICE: "practice",
});

const PROJECT_STATUSES = Object.freeze({
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  ARCHIVED: "archived",
});

const RULE_TYPES = Object.freeze({
  GENERIC: "generic",
  CHALLENGE_SPECIFIC: "challenge_specific",
});

const ARCHITECTURE_LIMITS = Object.freeze({
  MAX_NODES: 200,
  MAX_EDGES: 400,
});

module.exports = {
  API_VERSION,
  EVALUATION_ENGINE_VERSION,
  SIMULATION_ENGINE_VERSION,
  PASSING_SCORE_THRESHOLD,
  DEFAULT_TIMEZONE,
  ROLES,
  ACCOUNT_STATUSES,
  PROJECT_MODES,
  PROJECT_STATUSES,
  RULE_TYPES,
  ARCHITECTURE_LIMITS,
};