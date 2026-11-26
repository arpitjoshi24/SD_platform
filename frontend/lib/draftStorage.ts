import type { Edge, Node } from "@xyflow/react";
import { restoreGraph, serializeGraph } from "@/lib/graph";

export interface LocalDraftRecord {
  projectId: string;
  userId?: string | null;
  nodes: Node[];
  edges: Edge[];
  savedAt: string;
}

const DRAFT_PREFIX = "archmentor_draft_v1";

function buildDraftKey(projectId: string, userId?: string | null): string {
  return `${DRAFT_PREFIX}:${userId || "anon"}:${projectId}`;
}

export function loadLocalDraft(
  projectId: string,
  userId?: string | null
): LocalDraftRecord | null {
  if (typeof window === "undefined" || !projectId) return null;

  try {
    const raw = window.localStorage.getItem(buildDraftKey(projectId, userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      projectId?: unknown;
      userId?: unknown;
      nodes?: unknown;
      edges?: unknown;
      savedAt?: unknown;
    };

    if (!parsed || typeof parsed !== "object") return null;

    const restored = restoreGraph(parsed.nodes, parsed.edges);
    return {
      projectId,
      userId: typeof parsed.userId === "string" ? parsed.userId : userId ?? null,
      nodes: restored.nodes,
      edges: restored.edges,
      savedAt:
        typeof parsed.savedAt === "string" && parsed.savedAt
          ? parsed.savedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveLocalDraft(
  projectId: string,
  nodes: Node[],
  edges: Edge[],
  userId?: string | null
): LocalDraftRecord | null {
  if (typeof window === "undefined" || !projectId) return null;

  const serialized = serializeGraph(nodes, edges);
  const record: LocalDraftRecord = {
    projectId,
    userId: userId ?? null,
    nodes: serialized.nodes as Node[],
    edges: serialized.edges as Edge[],
    savedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      buildDraftKey(projectId, userId),
      JSON.stringify(record)
    );
    return record;
  } catch {
    return null;
  }
}

export function clearLocalDraft(
  projectId: string,
  userId?: string | null
): void {
  if (typeof window === "undefined" || !projectId) return;

  try {
    window.localStorage.removeItem(buildDraftKey(projectId, userId));
  } catch {
    // Ignore storage errors
  }
}