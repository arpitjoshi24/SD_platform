const AppError = require("../utils/AppError");
const { calculateScore, getGrade } = require("../utils/score");
const { SEVERITY } = require("../types/ruleTypes");
const { normalizeNodes, normalizeEdges } = require("../types/nodeTypes");
const { evaluationConfigSchema } = require("../validators/challenge.validator");
const { buildGraph } = require("../rules/graph");
const { createIssue } = require("../rules/issue");
const genericRules = require("../rules/genericRules");
const challengeRules = require("../rules/challengeRules");
const { findProjectById } = require("../repositories/project.repository");
const {
  findChallengeEvaluationConfig,
} = require("../repositories/challenge.repository");

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

const parseConfig = (rawConfig) => {
  const result = evaluationConfigSchema.safeParse(rawConfig || {});

  if (!result.success) {
    // A bad config must never crash an evaluation: fall back to generic rules only.
    console.error("Invalid evaluation_config, using defaults:", result.error.issues);
    return evaluationConfigSchema.parse({});
  }

  return result.data;
};

/**
 * Pure function: no DB, no HTTP. Easy to unit test.
 */
const evaluateArchitecture = ({ nodes = [], edges = [], config = {} }) => {
  const normalizedNodes = normalizeNodes(nodes);
  const normalizedEdges = normalizeEdges(edges);
  const parsedConfig = parseConfig(config);

  const componentCounts = normalizedNodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  const stats = {
    nodeCount: normalizedNodes.length,
    edgeCount: normalizedEdges.length,
    componentCounts,
  };

  // Nothing to evaluate
  if (normalizedNodes.length === 0) {
    const issues = [
      createIssue({
        ruleId: "EMPTY_DESIGN",
        severity: SEVERITY.ERROR,
        category: "structure",
        title: "The canvas is empty",
        message: "Add components and connect them before evaluating.",
        suggestion: "Start with the components listed in the challenge requirements.",
        penalty: 100,
      }),
    ];

    return buildResult(issues, stats);
  }

  const graph = buildGraph(normalizedNodes, normalizedEdges);

  const issues = [
    ...genericRules.flatMap((rule) => rule(graph)),
    ...challengeRules.flatMap((rule) => rule(graph, parsedConfig)),
  ];

  return buildResult(issues, stats);
};

const buildResult = (issues, stats) => {
  const sorted = [...issues].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      b.penalty - a.penalty
  );

  const score = calculateScore(sorted);

  const summary = {
    errors: sorted.filter((i) => i.severity === SEVERITY.ERROR).length,
    warnings: sorted.filter((i) => i.severity === SEVERITY.WARNING).length,
    info: sorted.filter((i) => i.severity === SEVERITY.INFO).length,
  };

  return {
    score,
    grade: getGrade(score),
    passed: summary.errors === 0,
    summary,
    stats,
    issues: sorted,
    evaluatedAt: new Date().toISOString(),
  };
};

/**
 * Loads the user's saved project + its challenge rules and evaluates them.
 */
const evaluateProject = async (project_id, user_id) => {
  const project = await findProjectById(project_id, user_id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const challenge = await findChallengeEvaluationConfig(project.challenge_id);

  if (!challenge) {
    throw new AppError("Challenge not found", 404);
  }

  return evaluateArchitecture({
    nodes: project.nodes,
    edges: project.edges,
    config: challenge.evaluation_config,
  });
};

module.exports = { evaluateArchitecture, evaluateProject };
