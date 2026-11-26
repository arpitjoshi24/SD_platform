
const { createIssue } = require("./issue");
const { SEVERITY, CATEGORY } = require("../types/ruleTypes");
const { labelOf } = require("../types/componentTypes");
const { evaluationConfigSchema } = require("../validators/challenge.validator");

const toPair = (entry) =>
  Array.isArray(entry)
    ? { from: entry[0], to: entry[1], reason: undefined }
    : entry;

const count = (g, type) => g.nodesOfType(type).length;

const withArticle = (label) =>
  /^[aeiou]/i.test(label) ? `an ${label}` : `a ${label}`;

const plural = (label) => (label.endsWith("s") ? label : `${label}s`);

const resolveConfig = (configOrCtx = {}) => {
  const raw =
    configOrCtx &&
    typeof configOrCtx === "object" &&
    configOrCtx.snapshot_config &&
    typeof configOrCtx.snapshot_config === "object"
      ? configOrCtx.snapshot_config
      : configOrCtx;

  const parsed = evaluationConfigSchema.safeParse(raw || {});
  return parsed.success ? parsed.data : evaluationConfigSchema.parse({});
};

const requiredComponents = (g, configOrCtx = {}) => {
  const config = resolveConfig(configOrCtx);
  const override = configOrCtx?.ruleConfig || {};
  const list = Array.isArray(override.required_components)
    ? override.required_components
    : config.required_components;

  return list
    .filter((rule) => count(g, rule.type) < (rule.min ?? 1))
    .map((rule) => {
      const min = rule.min ?? 1;
      const have = count(g, rule.type);

      return createIssue({
        ruleId: "REQUIRED_COMPONENT_MISSING",
        severity: override.severity || SEVERITY.ERROR,
        category: CATEGORY.REQUIREMENT,
        title: `Missing ${labelOf(rule.type)}`,
        message:
          rule.reason ||
          `This challenge needs at least ${min} ${labelOf(rule.type)}${
            min > 1 ? "s" : ""
          } (you have ${have}).`,
        suggestion: `Drag ${withArticle(labelOf(rule.type))} onto the canvas and connect it.`,
        penalty: override.penalty,
      });
    });
};

const recommendedComponents = (g, configOrCtx = {}) => {
  const config = resolveConfig(configOrCtx);
  const override = configOrCtx?.ruleConfig || {};
  const list = Array.isArray(override.recommended_components)
    ? override.recommended_components
    : config.recommended_components;

  return list
    .filter((rule) => count(g, rule.type) < (rule.min ?? 1))
    .map((rule) => {
      const min = rule.min ?? 1;
      return createIssue({
        ruleId: "RECOMMENDED_COMPONENT_MISSING",
        severity: override.severity || SEVERITY.WARNING,
        category: CATEGORY.PERFORMANCE,
        title:
          min > 1
            ? `Consider using at least ${min} ${plural(labelOf(rule.type))}`
            : `Consider adding ${withArticle(labelOf(rule.type))}`,
        message:
          rule.reason ||
          `${withArticle(labelOf(rule.type))} would strengthen this design.`,
        suggestion:
          min > 1
            ? `Add more ${plural(labelOf(rule.type))} and connect them like the existing one.`
            : `Add ${withArticle(labelOf(rule.type))} and connect it to the relevant services.`,
        penalty: override.penalty ?? 6,
      });
    });
};

const missingConnections = (g, entries, { ruleId, severity, penalty, overridePenalty }) =>
  (entries || []).map(toPair).flatMap((pair) => {
    if (!pair?.from || !pair?.to) return [];
    if (count(g, pair.from) === 0 || count(g, pair.to) === 0) return [];
    if (g.edgesBetweenTypes(pair.from, pair.to).length > 0) return [];

    const reversed = g.edgesBetweenTypes(pair.to, pair.from);
    const fromLabel = labelOf(pair.from);
    const toLabel = labelOf(pair.to);

    return [
      createIssue({
        ruleId,
        severity,
        category: CATEGORY.CONNECTION,
        title: reversed.length
          ? `${fromLabel} → ${toLabel} is reversed`
          : `Missing connection: ${fromLabel} → ${toLabel}`,
        message:
          pair.reason ||
          (reversed.length
            ? `You connected ${toLabel} → ${fromLabel}, but the request should flow from ${fromLabel} to ${toLabel}.`
            : `${fromLabel} should be connected to ${toLabel}.`),
        suggestion: reversed.length
          ? "Flip the direction of that arrow."
          : `Draw a connection from the ${fromLabel} to the ${toLabel}.`,
        nodeIds: [
          ...g.nodesOfType(pair.from).map((n) => n.id),
          ...g.nodesOfType(pair.to).map((n) => n.id),
        ],
        edgeIds: reversed.map((e) => e.id),
        penalty: overridePenalty ?? penalty,
      }),
    ];
  });

const requiredConnections = (g, configOrCtx = {}) => {
  const config = resolveConfig(configOrCtx);
  const override = configOrCtx?.ruleConfig || {};
  const entries = Array.isArray(override.required_connections)
    ? override.required_connections
    : config.required_connections;

  return missingConnections(g, entries, {
    ruleId: "REQUIRED_CONNECTION_MISSING",
    severity: override.severity || SEVERITY.ERROR,
    penalty: 12,
    overridePenalty: override.penalty,
  });
};

const recommendedConnections = (g, configOrCtx = {}) => {
  const config = resolveConfig(configOrCtx);
  const override = configOrCtx?.ruleConfig || {};
  const entries = Array.isArray(override.recommended_connections)
    ? override.recommended_connections
    : config.recommended_connections;

  return missingConnections(g, entries, {
    ruleId: "RECOMMENDED_CONNECTION_MISSING",
    severity: override.severity || SEVERITY.WARNING,
    penalty: 5,
    overridePenalty: override.penalty,
  });
};

const forbiddenConnections = (g, configOrCtx = {}) => {
  const config = resolveConfig(configOrCtx);
  const override = configOrCtx?.ruleConfig || {};
  const entries = Array.isArray(override.forbidden_connections)
    ? override.forbidden_connections
    : config.forbidden_connections;

  return (entries || []).map(toPair).flatMap((pair) => {
    if (!pair?.from || !pair?.to) return [];
    return g.edgesBetweenTypes(pair.from, pair.to).map((edge) =>
      createIssue({
        ruleId: "FORBIDDEN_CONNECTION",
        severity: override.severity || SEVERITY.ERROR,
        category: CATEGORY.CONNECTION,
        title: `Not allowed: ${labelOf(pair.from)} → ${labelOf(pair.to)}`,
        message:
          pair.reason ||
          `${labelOf(pair.from)} should not connect directly to ${labelOf(pair.to)} in this design.`,
        suggestion:
          "Remove this connection and route the request through the proper layer.",
        nodeIds: [edge.source, edge.target],
        edgeIds: [edge.id],
        penalty: override.penalty ?? 10,
      })
    );
  });
};

const challengeRuleHandlers = Object.freeze({
  REQUIRED_COMPONENT_MISSING: requiredComponents,
  RECOMMENDED_COMPONENT_MISSING: recommendedComponents,
  REQUIRED_CONNECTION_MISSING: requiredConnections,
  RECOMMENDED_CONNECTION_MISSING: recommendedConnections,
  FORBIDDEN_CONNECTION: forbiddenConnections,
});

const legacyChallengeRulesList = [
  requiredComponents,
  recommendedComponents,
  requiredConnections,
  recommendedConnections,
  forbiddenConnections,
];

module.exports = Object.assign(legacyChallengeRulesList, {
  challengeRuleHandlers,
  requiredComponents,
  recommendedComponents,
  requiredConnections,
  recommendedConnections,
  forbiddenConnections,
});