const AppError = require("../utils/AppError");
const { genericRuleHandlers } = require("./genericRules");
const { challengeRuleHandlers } = require("./challengeRules");

const EXPECTED_SEEDED_RULE_KEYS = Object.freeze([
  "DANGLING_EDGE",
  "SELF_LOOP",
  "DUPLICATE_EDGE",
  "ISOLATED_NODE",
  "CYCLE",
  "PASSIVE_COMPONENT_CALLING_OUT",
  "LB_NO_BACKENDS",
  "LB_WRONG_TARGET",
  "LB_SINGLE_BACKEND",
  "CACHE_UNUSED",
  "QUEUE_NO_PRODUCER",
  "QUEUE_NO_CONSUMER",
  "DB_NOT_BEHIND_API",
  "SINGLE_DATABASE",
  "REQUIRED_COMPONENT_MISSING",
  "RECOMMENDED_COMPONENT_MISSING",
  "REQUIRED_CONNECTION_MISSING",
  "RECOMMENDED_CONNECTION_MISSING",
  "FORBIDDEN_CONNECTION",
]);

const registry = new Map();

const registerEntries = (entries, sourceLabel) => {
  for (const [key, fn] of Object.entries(entries || {})) {
    const normalizedKey = String(key || "").trim();
    if (!normalizedKey) continue;
    if (typeof fn !== "function") {
      throw new AppError(
        `Invalid handler for rule_key '${normalizedKey}' in ${sourceLabel}`,
        500
      );
    }
    if (registry.has(normalizedKey)) {
      throw new AppError(
        `Duplicate rule handler registered for rule_key '${normalizedKey}'`,
        500
      );
    }
    registry.set(normalizedKey, fn);
  }
};

registerEntries(genericRuleHandlers, "genericRules");
registerEntries(challengeRuleHandlers, "challengeRules");

const validateRuleRegistry = () => {
  const missing = EXPECTED_SEEDED_RULE_KEYS.filter((k) => !registry.has(k));
  if (missing.length > 0) {
    throw new AppError(
      `Missing rule handlers in registry for keys: ${missing.join(", ")}`,
      500
    );
  }
  return true;
};

const hasRuleHandler = (ruleKey) => registry.has(String(ruleKey || "").trim());

const getRuleHandler = (ruleKey) => {
  const key = String(ruleKey || "").trim();
  const handler = registry.get(key);
  if (!handler) {
    throw new AppError(
      `No executable rule handler registered for rule_key '${key}'`,
      500
    );
  }
  return handler;
};

const executeRule = (ruleKey, graph, context = {}) => {
  const handler = getRuleHandler(ruleKey);
  const issues = handler(graph, context);
  if (!Array.isArray(issues)) return [];

  return issues.map((issue) => ({
    ...issue,
    ruleId: issue.ruleId || issue.rule_key || ruleKey,
    rule_key: issue.rule_key || issue.ruleId || ruleKey,
  }));
};

const getRegisteredRuleKeys = () => Array.from(registry.keys());

module.exports = {
  EXPECTED_SEEDED_RULE_KEYS,
  validateRuleRegistry,
  hasRuleHandler,
  getRuleHandler,
  executeRule,
  getRegisteredRuleKeys,
};