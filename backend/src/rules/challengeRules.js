/**
 * Challenge rules: driven by challenges.evaluation_config.
 * Adding a new challenge = adding data, not code.
 * Each rule: (graph, config) => Issue[]
 */
const { createIssue } = require("./issue");
const { SEVERITY, CATEGORY } = require("../types/ruleTypes");
const { labelOf } = require("../types/componentTypes");

// ["api","database"] | {from,to,reason}  ->  {from,to,reason}
const toPair = (entry) =>
  Array.isArray(entry)
    ? { from: entry[0], to: entry[1], reason: undefined }
    : entry;

const count = (g, type) => g.nodesOfType(type).length;

// "a Cache", "an API Server"
const withArticle = (label) => (/^[aeiou]/i.test(label) ? `an ${label}` : `a ${label}`);

const plural = (label) => (label.endsWith("s") ? label : `${label}s`);

const requiredComponents = (g, config) =>
  config.required_components
    .filter((rule) => count(g, rule.type) < rule.min)
    .map((rule) => {
      const have = count(g, rule.type);

      return createIssue({
        ruleId: "REQUIRED_COMPONENT_MISSING",
        severity: SEVERITY.ERROR,
        category: CATEGORY.REQUIREMENT,
        title: `Missing ${labelOf(rule.type)}`,
        message:
          rule.reason ||
          `This challenge needs at least ${rule.min} ${labelOf(rule.type)}${
            rule.min > 1 ? "s" : ""
          } (you have ${have}).`,
        suggestion: `Drag ${withArticle(labelOf(rule.type))} onto the canvas and connect it.`,
      });
    });

const recommendedComponents = (g, config) =>
  config.recommended_components
    .filter((rule) => count(g, rule.type) < rule.min)
    .map((rule) =>
      createIssue({
        ruleId: "RECOMMENDED_COMPONENT_MISSING",
        severity: SEVERITY.WARNING,
        category: CATEGORY.PERFORMANCE,
        title:
          rule.min > 1
            ? `Consider using at least ${rule.min} ${plural(labelOf(rule.type))}`
            : `Consider adding ${withArticle(labelOf(rule.type))}`,
        message:
          rule.reason ||
          `${withArticle(labelOf(rule.type))} would strengthen this design.`,
        suggestion:
          rule.min > 1
            ? `Add more ${plural(labelOf(rule.type))} and connect them like the existing one.`
            : `Add ${withArticle(labelOf(rule.type))} and connect it to the relevant services.`,
        penalty: 6,
      })
    );

/**
 * Shared logic for required / recommended connections.
 * - If either component type is absent, skip: the component rule already reported it.
 * - If the connection exists only in reverse, say so (most common beginner mistake).
 */
const missingConnections = (g, entries, { ruleId, severity, penalty }) =>
  entries.map(toPair).flatMap((pair) => {
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
        penalty,
      }),
    ];
  });

const requiredConnections = (g, config) =>
  missingConnections(g, config.required_connections, {
    ruleId: "REQUIRED_CONNECTION_MISSING",
    severity: SEVERITY.ERROR,
    penalty: 12,
  });

const recommendedConnections = (g, config) =>
  missingConnections(g, config.recommended_connections, {
    ruleId: "RECOMMENDED_CONNECTION_MISSING",
    severity: SEVERITY.WARNING,
    penalty: 5,
  });

const forbiddenConnections = (g, config) =>
  config.forbidden_connections.map(toPair).flatMap((pair) =>
    g.edgesBetweenTypes(pair.from, pair.to).map((edge) =>
      createIssue({
        ruleId: "FORBIDDEN_CONNECTION",
        severity: SEVERITY.ERROR,
        category: CATEGORY.CONNECTION,
        title: `Not allowed: ${labelOf(pair.from)} → ${labelOf(pair.to)}`,
        message:
          pair.reason ||
          `${labelOf(pair.from)} should not connect directly to ${labelOf(pair.to)} in this design.`,
        suggestion: "Remove this connection and route the request through the proper layer.",
        nodeIds: [edge.source, edge.target],
        edgeIds: [edge.id],
        penalty: 10,
      })
    )
  );

module.exports = [
  requiredComponents,
  recommendedComponents,
  requiredConnections,
  recommendedConnections,
  forbiddenConnections,
];
