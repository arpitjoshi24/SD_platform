import type { Edge, Node } from "@xyflow/react";

export interface SerializedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface SerializedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
  markerEnd?: unknown;
}

export interface SerializedGraphSnapshot {
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

/**
 * Keep only what needs to be stored. React Flow adds runtime fields
 * (measured, selected, dragging...) that must not end up in the database
 * or make the design look "changed" when nothing changed.
 */
export function serializeGraph(
  nodes: Node[],
  edges: Edge[]
): SerializedGraphSnapshot {
  return {
    nodes: nodes.map(({ id, type, position, data }) => ({
      id,
      type: type ?? "api",
      position: {
        x: Math.round(position?.x ?? 0),
        y: Math.round(position?.y ?? 0),
      },
      data: (data && typeof data === "object"
        ? { ...(data as Record<string, unknown>) }
        : {}) as Record<string, unknown>,
    })),
    edges: edges.map(
      ({
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        type,
        animated,
        style,
        markerEnd,
      }) => ({
        id,
        source,
        target,
        ...(sourceHandle !== undefined ? { sourceHandle } : {}),
        ...(targetHandle !== undefined ? { targetHandle } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(animated !== undefined ? { animated } : {}),
        ...(style !== undefined
          ? { style: { ...(style as Record<string, unknown>) } }
          : {}),
        ...(markerEnd !== undefined ? { markerEnd } : {}),
      })
    ),
  };
}

/**
 * Restores nodes/edges from a stored snapshot or draft into clean React Flow instances.
 */
export function restoreGraph(
  rawNodes: unknown,
  rawEdges: unknown
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = Array.isArray(rawNodes)
    ? rawNodes
        .filter((n): n is Record<string, unknown> => Boolean(n && typeof n === "object"))
        .map((n, index) => {
          const pos =
            n.position && typeof n.position === "object"
              ? (n.position as { x?: unknown; y?: unknown })
              : {};
          return {
            id: typeof n.id === "string" && n.id ? n.id : `node_${index + 1}`,
            type: typeof n.type === "string" && n.type ? n.type : "api",
            position: {
              x: typeof pos.x === "number" && Number.isFinite(pos.x) ? pos.x : 0,
              y: typeof pos.y === "number" && Number.isFinite(pos.y) ? pos.y : 0,
            },
            data:
              n.data && typeof n.data === "object"
                ? { ...(n.data as Record<string, unknown>) }
                : {},
          };
        })
    : [];

  const edges: Edge[] = Array.isArray(rawEdges)
    ? rawEdges
        .filter((e): e is Record<string, unknown> => Boolean(e && typeof e === "object"))
        .map((e, index) => ({
          id:
            typeof e.id === "string" && e.id
              ? e.id
              : `edge_${String(e.source ?? "s")}_${String(e.target ?? "t")}_${index}`,
          source: typeof e.source === "string" ? e.source : "",
          target: typeof e.target === "string" ? e.target : "",
          ...(typeof e.sourceHandle === "string" ? { sourceHandle: e.sourceHandle } : {}),
          ...(typeof e.targetHandle === "string" ? { targetHandle: e.targetHandle } : {}),
          ...(typeof e.type === "string" ? { type: e.type } : {}),
          ...(typeof e.animated === "boolean" ? { animated: e.animated } : {}),
          ...(e.style && typeof e.style === "object"
            ? { style: { ...(e.style as Record<string, unknown>) } }
            : {}),
          ...(e.markerEnd !== undefined ? { markerEnd: e.markerEnd as Edge["markerEnd"] } : {}),
        }))
        .filter((e) => Boolean(e.source && e.target))
    : [];

  return { nodes, edges };
}

/**
 * Deterministic fingerprint used to detect real graph changes and invalidate
 * stale transient evaluation results when the topology changes.
 */
export function getGraphFingerprint(nodes: Node[], edges: Edge[]): string {
  return JSON.stringify(serializeGraph(nodes, edges));
}