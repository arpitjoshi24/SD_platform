/**
 * Converts raw React Flow nodes/edges (as stored in user_projects)
 * into the minimal shape the rule engine needs.
 */
const getNodeType = (node) =>
  node?.data?.componentType || node?.type || "unknown";

const normalizeNodes = (nodes = []) =>
  nodes.map((node) => ({
    id: String(node.id),
    type: getNodeType(node),
    label: node?.data?.label || getNodeType(node),
  }));

const normalizeEdges = (edges = []) =>
  edges.map((edge) => ({
    id: String(edge.id),
    source: String(edge.source),
    target: String(edge.target),
  }));

module.exports = { getNodeType, normalizeNodes, normalizeEdges };
