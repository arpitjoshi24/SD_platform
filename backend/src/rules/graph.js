const buildGraph = (nodes = [], edges = []) => {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];

  const nodeById = new Map();
  const duplicateNodeIds = new Set();

  for (const node of safeNodes) {
    if (!node || !node.id) continue;
    const id = String(node.id);
    if (nodeById.has(id)) {
      duplicateNodeIds.add(id);
      continue;
    }
    nodeById.set(id, { ...node, id });
  }

  const uniqueNodes = Array.from(nodeById.values());
  const outgoing = new Map(uniqueNodes.map((n) => [n.id, []]));
  const incoming = new Map(uniqueNodes.map((n) => [n.id, []]));

  const validEdges = [];
  const danglingEdges = [];
  const duplicateEdges = [];
  const seenEdgeKeys = new Set();

  for (const edge of safeEdges) {
    if (!edge || edge.source === undefined || edge.target === undefined) continue;
    const normalizedEdge = {
      ...edge,
      id: String(edge.id || ""),
      source: String(edge.source),
      target: String(edge.target),
    };

    const pairKey = `${normalizedEdge.source}->${normalizedEdge.target}`;
    if (seenEdgeKeys.has(pairKey)) {
      duplicateEdges.push(normalizedEdge);
    } else {
      seenEdgeKeys.add(pairKey);
    }

    if (!nodeById.has(normalizedEdge.source) || !nodeById.has(normalizedEdge.target)) {
      danglingEdges.push(normalizedEdge);
      continue;
    }

    validEdges.push(normalizedEdge);
    outgoing.get(normalizedEdge.source).push(normalizedEdge);
    incoming.get(normalizedEdge.target).push(normalizedEdge);
  }

  const nodesOfType = (type) => uniqueNodes.filter((n) => n.type === type);
  const typeOf = (id) => nodeById.get(id)?.type;

  const edgesBetweenTypes = (from, to) =>
    validEdges.filter(
      (e) => typeOf(e.source) === from && typeOf(e.target) === to
    );

  const findCycle = () => {
    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;

    const color = new Map(uniqueNodes.map((n) => [n.id, WHITE]));
    const stack = [];

    const nextNodes = (id) => {
      if (typeOf(id) === "queue") return [];
      return (outgoing.get(id) || []).map((e) => e.target);
    };

    const visit = (id) => {
      color.set(id, GRAY);
      stack.push(id);

      for (const next of nextNodes(id)) {
        if (!color.has(next)) continue;
        if (color.get(next) === GRAY) {
          return stack.slice(stack.indexOf(next));
        }
        if (color.get(next) === WHITE) {
          const cycle = visit(next);
          if (cycle) return cycle;
        }
      }

      stack.pop();
      color.set(id, BLACK);
      return null;
    };

    for (const node of uniqueNodes) {
      if (color.get(node.id) === WHITE) {
        const cycle = visit(node.id);
        if (cycle) return cycle;
      }
    }

    return null;
  };

  return {
    nodes: uniqueNodes,
    edges: validEdges,
    danglingEdges,
    duplicateEdges,
    duplicateNodeIds: Array.from(duplicateNodeIds),
    nodeById,
    outgoing,
    incoming,
    nodesOfType,
    typeOf,
    edgesBetweenTypes,
    findCycle,
  };
};

module.exports = { buildGraph };