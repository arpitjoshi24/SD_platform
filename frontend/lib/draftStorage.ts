import type { Edge, Node } from "@xyflow/react";
import { getGraphFingerprint, restoreGraph, serializeGraph } from "@/lib/graph";

export interface LocalDraftRecord {
  version: 1;
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

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  return Number.isFinite(Date.parse(value));
}

export function loadLocalDraft(
  projectId: string,
  userId?: string | null
): LocalDraftRecord | null {
  if (typeof window === "undefined" || !projectId) return null;

  const key = buildDraftKey(projectId, userId);

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      version?: unknown;
      projectId?: unknown;
      userId?: unknown;
      nodes?: unknown;
      edges?: unknown;
      savedAt?: unknown;
    };

    if (!parsed || typeof parsed !== "object") {
      clearLocalDraft(projectId, userId);
      return null;
    }

    if (parsed.version !== undefined && parsed.version !== 1) {
      clearLocalDraft(projectId, userId);
      return null;
    }

    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      clearLocalDraft(projectId, userId);
      return null;
    }

    const restored = restoreGraph(parsed.nodes, parsed.edges);
    return {
      version: 1,
      projectId,
      userId: typeof parsed.userId === "string" ? parsed.userId : userId ?? null,
      nodes: restored.nodes,
      edges: restored.edges,
      savedAt: isValidIsoDate(parsed.savedAt)
        ? parsed.savedAt
        : new Date().toISOString(),
    };
  } catch {
    clearLocalDraft(projectId, userId);
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
    version: 1,
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

export function isDraftNewerThanAttempt(
  draft: LocalDraftRecord,
  attemptSavedAt?: string | null,
  attemptNodes?: unknown,
  attemptEdges?: unknown
): boolean {
  const restoredAttempt = restoreGraph(attemptNodes ?? [], attemptEdges ?? []);
  if (
    getGraphFingerprint(draft.nodes, draft.edges) ===
    getGraphFingerprint(restoredAttempt.nodes, restoredAttempt.edges)
  ) {
    return false;
  }

  if (!attemptSavedAt) return true;
  const draftTime = Date.parse(draft.savedAt);
  const attemptTime = Date.parse(attemptSavedAt);
  if (!Number.isFinite(draftTime) || !Number.isFinite(attemptTime)) {
    return true;
  }
  return draftTime > attemptTime;
}