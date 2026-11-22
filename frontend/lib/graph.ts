import type { Edge, Node } from "@xyflow/react";

/**
 * Keep only what needs to be stored. React Flow adds runtime fields
 * (measured, selected, dragging...) that must not end up in the database
 * or make the design look "changed" when nothing changed.
 */
export function serializeGraph(nodes: Node[], edges: Edge[]) {
  return {
    nodes: nodes.map(({ id, type, position, data }) => ({
      id,
      type,
      position: { x: Math.round(position.x), y: Math.round(position.y) },
      data,
    })),
    edges: edges.map(
      ({ id, source, target, sourceHandle, targetHandle, type, animated, style, markerEnd }) => ({
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        type,
        animated,
        style,
        markerEnd,
      })
    ),
  };
}
