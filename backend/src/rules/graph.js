/**
 * Small directed-graph helper built from normalized nodes/edges.
 * Edges that point to missing nodes are kept out of the adjacency maps
 * (a separate rule reports them).
 */
const buildGraph = (nodes, edges) => {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const outgoing = new Map(nodes.map((n) => [n.id, []]));
  const incoming = new Map(nodes.map((n) => [n.id, []]));

  const validEdges = [];
  const danglingEdges = [];

  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
      danglingEdges.push(edge);
      continue;
    }

    validEdges.push(edge);
    outgoing.get(edge.source).push(edge);
    incoming.get(edge.target).push(edge);
  }

  const nodesOfType = (type) => nodes.filter((n) => n.type === type);

  const typeOf = (id) => nodeById.get(id)?.type;

  // Is there an edge from any node of type `from` to any node of type `to`?
  const edgesBetweenTypes = (from, to) =>
    validEdges.filter(
      (e) => typeOf(e.source) === from && typeOf(e.target) === to
    );

  /**
   * Find one cycle (returns array of node ids) or null.
   * Edges leaving a queue are ignored: a queue makes the hand-off
   * asynchronous, so "api -> queue -> api (worker)" is a valid pattern.
   */
  const findCycle = () => {
    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;

    const color = new Map(nodes.map((n) => [n.id, WHITE]));
    const stack = [];

    const nextNodes = (id) => {
      if (typeOf(id) === "queue") return [];
      return outgoing.get(id).map((e) => e.target);
    };

    const visit = (id) => {
      color.set(id, GRAY);
      stack.push(id);

      for (const next of nextNodes(id)) {
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

    for (const node of nodes) {
      if (color.get(node.id) === WHITE) {
        const cycle = visit(node.id);
        if (cycle) return cycle;
      }
    }

    return null;
  };

  return {
    nodes,
    edges: validEdges,
    danglingEdges,
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
