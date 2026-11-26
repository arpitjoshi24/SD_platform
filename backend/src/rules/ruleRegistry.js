const AppError = require("../utils/AppError");
const { genericRuleHandlers } = require("./genericRules");
const { challengeRuleHandlers } = require("./challengeRules");

const registry = new Map();

for (const [key, fn] of Object.entries(genericRuleHandlers || {})) {
  if (typeof fn === "function") {
    registry.set(key, fn);
  }
}

for (const [key, fn] of Object.entries(challengeRuleHandlers || {})) {
  if (typeof fn === "function") {
    registry.set(key, fn);
  }
}

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
  hasRuleHandler,
  getRuleHandler,
  executeRule,
  getRegisteredRuleKeys,
};