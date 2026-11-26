const AppError = require("../utils/AppError");
const { calculateScore, getGrade, isPassingScore } = require("../utils/score");
const { EVALUATION_ENGINE_VERSION } = require("../utils/constants");
const { SEVERITY } = require("../types/ruleTypes");
const { normalizeArchitectureSnapshot } = require("../types/nodeTypes");
const { evaluationConfigSchema } = require("../validators/challenge.validator");
const { buildGraph } = require("../rules/graph");
const { createIssue } = require("../rules/issue");
const { executeRule, hasRuleHandler } = require("../rules/ruleRegistry");
const {
  findProjectById,
  findProjectChallengeVersion,
} = require("../repositories/project.repository");
const { resolveApplicableRulesForProject } = require("./rule.service");

const SEVERITY_ORDER = { critical: -1, error: 0, warning: 1, info: 2 };

const parseConfig = (rawConfig) => {
  const result = evaluationConfigSchema.safeParse(rawConfig || {});
  if (!result.success) {
    return evaluationConfigSchema.parse({});
  }
  return result.data;
};

const buildStats = (nodes, edges) => {
  const componentCounts = nodes.reduce((acc, node) => {
    const key = node.type || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    componentCounts,
  };
};

const evaluateArchitecture = ({
  nodes = [],
  edges = [],
  config = {},
  resolvedRules = [],
  challengeSnapshotConfig = null,
}) => {
  const { nodes: normalizedNodes, edges: normalizedEdges } =
    normalizeArchitectureSnapshot({ nodes, edges });
  const parsedConfig = parseConfig(challengeSnapshotConfig || config);
  const stats = buildStats(normalizedNodes, normalizedEdges);

  if (normalizedNodes.length === 0) {
    const issues = [
      createIssue({
        ruleId: "EMPTY_DESIGN",
        ruleKey: "EMPTY_DESIGN",
        severity: SEVERITY.ERROR,
        category: "structure",
        title: "The canvas is empty",
        message: "Add components and connect them before evaluating.",
        suggestion:
          "Start with the components listed in the challenge requirements.",
        penalty: 100,
      }),
    ];

    return buildResult(issues, stats, []);
  }

  const graph = buildGraph(normalizedNodes, normalizedEdges);
  const collectedIssues = [];
  const appliedRulesMeta = [];

  for (const ruleItem of resolvedRules) {
    if (!ruleItem || !ruleItem.rule_key) continue;
    if (!hasRuleHandler(ruleItem.rule_key)) {
      throw new AppError(
        `Missing executable rule handler for '${ruleItem.rule_key}'`,
        500
      );
    }

    const ruleContext = {
      snapshot_config: parsedConfig,
      ruleConfig: ruleItem.eval_params || ruleItem.config_snapshot || {},
      ruleMeta: ruleItem,
    };

    const issuesFromRule = executeRule(ruleItem.rule_key, graph, ruleContext);
    collectedIssues.push(...issuesFromRule);

    appliedRulesMeta.push({
      rule_id: ruleItem.rule_id || null,
      rule_key: ruleItem.rule_key,
      rule_version_id: ruleItem.rule_version_id || null,
      rule_version_number: ruleItem.rule_version_number || null,
      rule_type: ruleItem.rule_type || "generic",
      is_mandatory: Boolean(ruleItem.is_mandatory),
      issuesFound: issuesFromRule.length,
    });
  }

  return buildResult(collectedIssues, stats, appliedRulesMeta);
};

const buildResult = (issues, stats, appliedRules = []) => {
  const sorted = [...issues].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99) ||
      (b.penalty || 0) - (a.penalty || 0)
  );

  const score = calculateScore(sorted);
  const passed = isPassingScore(score, sorted);
  const evaluatedAt = new Date().toISOString();

  const summary = {
    critical: sorted.filter((i) => i.severity === SEVERITY.CRITICAL).length,
    errors: sorted.filter((i) => i.severity === SEVERITY.ERROR).length,
    warnings: sorted.filter((i) => i.severity === SEVERITY.WARNING).length,
    info: sorted.filter((i) => i.severity === SEVERITY.INFO).length,
  };

  return {
    score,
    grade: getGrade(score),
    passed,
    summary,
    stats,
    issues: sorted,
    appliedRules,
    engineVersion: EVALUATION_ENGINE_VERSION,
    engine_version: EVALUATION_ENGINE_VERSION,
    evaluatedAt,
    evaluated_at: evaluatedAt,
  };
};

const evaluateProject = async (
  project_id,
  user_id,
  architectureInput = null
) => {
  const project = await findProjectById(project_id, user_id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  let challengeSnapshotConfig = {};
  if (project.project_mode === "challenge") {
    const versionInfo = await findProjectChallengeVersion(project_id, user_id);
    if (!versionInfo || !versionInfo.challenge_version_id) {
      throw new AppError("Challenge version not found for project", 404);
    }
    challengeSnapshotConfig = versionInfo.snapshot_config || {};
  }

  const resolvedRules = await resolveApplicableRulesForProject(project);
  const snapshot = normalizeArchitectureSnapshot(
    architectureInput || { nodes: [], edges: [] }
  );

  return evaluateArchitecture({
    nodes: snapshot.nodes,
    edges: snapshot.edges,
    resolvedRules,
    challengeSnapshotConfig,
  });
};

module.exports = { evaluateArchitecture, evaluateProject };