const { labelOf } = require("./componentTypes");

const getNodeType = (node) =>
  String(node?.data?.componentType || node?.type || "unknown")
    .trim()
    .toLowerCase();

const normalizeNodes = (nodes = []) => {
  if (!Array.isArray(nodes)) return [];

  return nodes
    .filter((node) => node && typeof node === "object" && node.id !== undefined)
    .map((node, idx) => {
      const id = String(node.id).trim();
      const type = getNodeType(node);
      const rawLabel = node?.data?.label;
      const label =
        typeof rawLabel === "string" && rawLabel.trim().length > 0
          ? rawLabel.trim()
          : labelOf(type);

      const x = Number(node?.position?.x);
      const y = Number(node?.position?.y);

      const data = {
        ...(node.data && typeof node.data === "object" ? node.data : {}),
        componentType: type,
        label,
      };

      return {
        id: id || `node-${idx + 1}`,
        type,
        position: {
          x: Number.isFinite(x) ? x : 0,
          y: Number.isFinite(y) ? y : 0,
        },
        data,
        label,
      };
    });
};

const normalizeEdges = (edges = []) => {
  if (!Array.isArray(edges)) return [];

  return edges
    .filter(
      (edge) =>
        edge &&
        typeof edge === "object" &&
        edge.source !== undefined &&
        edge.target !== undefined
    )
    .map((edge, idx) => {
      const id =
        edge.id !== undefined && String(edge.id).trim() !== ""
          ? String(edge.id).trim()
          : `edge-${idx + 1}`;

      return {
        id,
        source: String(edge.source).trim(),
        target: String(edge.target).trim(),
        type: typeof edge.type === "string" ? edge.type : "default",
        data:
          edge.data && typeof edge.data === "object" ? { ...edge.data } : {},
      };
    });
};

const normalizeArchitectureSnapshot = (raw = {}) => {
  const source =
    raw && typeof raw === "object" && raw.snapshot && typeof raw.snapshot === "object"
      ? raw.snapshot
      : raw && typeof raw === "object"
        ? raw
        : {};

  return {
    nodes: normalizeNodes(source.nodes || []),
    edges: normalizeEdges(source.edges || []),
  };
};

module.exports = {
  getNodeType,
  normalizeNodes,
  normalizeEdges,
  normalizeArchitectureSnapshot,
};