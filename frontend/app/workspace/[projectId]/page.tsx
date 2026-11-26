"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Edge, Node } from "@xyflow/react";
import {
  ArrowLeft,
  BookmarkCheck,
  Check,
  History,
  Play,
  RotateCcw,
  Sliders,
  Trash2,
} from "lucide-react";

import WorkspaceCanvas from "@/components/workspace/WorkspaceCanvas";
import EvaluationPanel from "@/components/workspace/EvaluationPanel";
import ErrorBanner from "@/components/ui/ErrorBanner";
import FullPageLoader from "@/components/ui/FullPageLoader";
import Spinner from "@/components/ui/Spinner";
import { architectureComponents } from "@/data/architectureComponents";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { useAuthStore } from "@/stores/auth.store";
import { getChallenge } from "@/services/challenge.service";
import { getProject } from "@/services/project.service";
import { evaluateProjectSnapshot } from "@/services/evaluation.service";
import {
  deleteAttemptById,
  getAttemptById,
  getProjectAttempts,
  saveProjectAttempt,
} from "@/services/attempt.service";
import {
  getProjectRuleSelections,
  updateProjectRuleSelections,
} from "@/services/rule.service";
import { getErrorMessage } from "@/lib/errors";
import {
  getGraphFingerprint,
  restoreGraph,
  serializeGraph,
} from "@/lib/graph";
import {
  clearLocalDraft,
  loadLocalDraft,
  saveLocalDraft,
} from "@/lib/draftStorage";
import { createIdempotencyKey } from "@/lib/token";
import type { Challenge } from "@/types/challenge";
import type { ProjectWithSummary } from "@/types/project";
import type { ProjectAttempt } from "@/types/attempt";
import type { ProjectRuleSelection } from "@/types/rule";
import type { EvaluationIssue, EvaluationResult } from "@/types/evaluation";

type DraftState = "saved" | "unsaved" | "saving" | "error";
type RightTab = "components" | "evaluation" | "attempts" | "rules";

const AUTOSAVE_DRAFT_MS = 1200;

export default function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [project, setProject] = useState<ProjectWithSummary | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loadError, setLoadError] = useState("");

  // Initial graph restored from local draft or latest saved attempt
  const [canvasKey, setCanvasKey] = useState("init");
  const [initialGraph, setInitialGraph] = useState<{
    nodes: Node[];
    edges: Edge[];
  }>({ nodes: [], edges: [] });
  const [readOnlySnapshot, setReadOnlySnapshot] = useState(false);

  // Local draft persistence state
  const [draftState, setDraftState] = useState<DraftState>("saved");
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [statusBanner, setStatusBanner] = useState("");

  // Right panel tabs & evaluation state
  const [rightTab, setRightTab] = useState<RightTab>("components");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [evaluationSource, setEvaluationSource] = useState<
    "transient" | "saved_attempt"
  >("transient");
  const [activeAttemptNumber, setActiveAttemptNumber] = useState<number | null>(
    null
  );
  const [evaluatedFingerprint, setEvaluatedFingerprint] = useState<string | null>(
    null
  );
  const [currentFingerprint, setCurrentFingerprint] = useState<string>("");
  const [evaluating, setEvaluating] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [highlightNodeIds, setHighlightNodeIds] = useState<string[]>([]);

  // Immutable attempts state
  const [attempts, setAttempts] = useState<ProjectAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [pendingIdempotencyKey, setPendingIdempotencyKey] = useState<
    string | null
  >(null);

  // Practice rules state
  const [ruleSelections, setRuleSelections] = useState<ProjectRuleSelection[]>(
    []
  );
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingRules, setSavingRules] = useState(false);

  const left = useResizablePanel({
    initial: 320,
    min: 240,
    max: 500,
    side: "left",
  });
  const right = useResizablePanel({
    initial: 360,
    min: 280,
    max: 500,
    side: "right",
  });

  const graphRef = useRef<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });
  const baselineSetRef = useRef(false);

  const refreshAttempts = useCallback(async () => {
    if (!projectId) return;
    setLoadingAttempts(true);
    try {
      const list = await getProjectAttempts(projectId);
      setAttempts(list);
      return list;
    } catch {
      return [];
    } finally {
      setLoadingAttempts(false);
    }
  }, [projectId]);

  // ------------------------------------------------------------------
  // Load project + challenge (if guided) + attempts + local draft
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    baselineSetRef.current = false;

    (async () => {
      try {
        const loadedProject = await getProject(projectId);
        if (cancelled) return;
        setProject(loadedProject);

        if (loadedProject.project_mode === "challenge" && loadedProject.challenge_id) {
          const loadedChallenge = await getChallenge(loadedProject.challenge_id);
          if (!cancelled) setChallenge(loadedChallenge);
        }

        const loadedAttempts = await getProjectAttempts(projectId).catch(
          () => []
        );
        if (cancelled) return;
        setAttempts(loadedAttempts);

        // Prefer browser-local draft if present; otherwise seed from latest saved attempt
        const localDraft = loadLocalDraft(projectId, userId);
        if (localDraft) {
          graphRef.current = {
            nodes: localDraft.nodes,
            edges: localDraft.edges,
          };
          setInitialGraph({
            nodes: localDraft.nodes,
            edges: localDraft.edges,
          });
          setLastDraftSavedAt(localDraft.savedAt);
          setCurrentFingerprint(
            getGraphFingerprint(localDraft.nodes, localDraft.edges)
          );
          setCanvasKey(`draft-${localDraft.savedAt}`);
        } else if (loadedAttempts.length > 0) {
          const latest = loadedAttempts[0];
          const restored = restoreGraph(
            latest.nodes_snapshot,
            latest.edges_snapshot
          );
          graphRef.current = restored;
          setInitialGraph(restored);
          setCurrentFingerprint(
            getGraphFingerprint(restored.nodes, restored.edges)
          );
          setCanvasKey(`attempt-${latest.id}`);
        } else {
          graphRef.current = { nodes: [], edges: [] };
          setInitialGraph({ nodes: [], edges: [] });
          setCurrentFingerprint(getGraphFingerprint([], []));
          setCanvasKey("empty");
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error, "Failed to load this project"));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, userId]);

  // Load practice rules when in practice mode
  useEffect(() => {
    if (!project || project.project_mode !== "practice") return;
    setLoadingRules(true);
    getProjectRuleSelections(project.id)
      .then(setRuleSelections)
      .catch(() => {})
      .finally(() => setLoadingRules(false));
  }, [project]);

  // ------------------------------------------------------------------
  // Local Draft Persistence (Browser localStorage — no DB graph writes)
  // ------------------------------------------------------------------
  const persistLocalDraft = useCallback(() => {
    if (!projectId) return;
    setDraftState("saving");
    const record = saveLocalDraft(
      projectId,
      graphRef.current.nodes,
      graphRef.current.edges,
      userId
    );
    if (record) {
      setDraftState("saved");
      setLastDraftSavedAt(record.savedAt);
    } else {
      setDraftState("error");
    }
  }, [projectId, userId]);

  const handleGraphChange = useCallback((nodes: Node[], edges: Edge[]) => {
    graphRef.current = { nodes, edges };
    const fp = getGraphFingerprint(nodes, edges);
    setCurrentFingerprint(fp);
    // Any new graph edit resets pending attempt idempotency key
    setPendingIdempotencyKey(null);

    if (!baselineSetRef.current) {
      baselineSetRef.current = true;
      return;
    }

    setDraftState("unsaved");
  }, []);

  useEffect(() => {
    if (draftState !== "unsaved") return;
    const timer = setTimeout(() => {
      persistLocalDraft();
    }, AUTOSAVE_DRAFT_MS);
    return () => clearTimeout(timer);
  }, [draftState, persistLocalDraft]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        persistLocalDraft();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [persistLocalDraft]);

  // ------------------------------------------------------------------
  // Transient Evaluation (POST /projects/:id/evaluate — no attempt saved)
  // ------------------------------------------------------------------
  const handleEvaluate = async () => {
    if (!projectId) return;
    setEvaluating(true);
    setActionError("");
    setStatusBanner("");
    setRightTab("evaluation");

    const serialized = serializeGraph(
      graphRef.current.nodes,
      graphRef.current.edges
    );
    const fp = JSON.stringify(serialized);

    try {
      const result = await evaluateProjectSnapshot(projectId, {
        snapshot: serialized,
      });
      setEvaluation(result);
      setEvaluationSource("transient");
      setActiveAttemptNumber(null);
      setEvaluatedFingerprint(fp);
      setSelectedIssueId(null);
      setHighlightNodeIds([]);
    } catch (error) {
      setActionError(getErrorMessage(error, "Evaluation failed"));
    } finally {
      setEvaluating(false);
    }
  };

  // ------------------------------------------------------------------
  // Explicit Immutable Attempt Save (POST /projects/:id/attempts)
  // ------------------------------------------------------------------
  const handleSaveAttempt = async () => {
    if (!projectId) return;
    setSavingAttempt(true);
    setActionError("");
    setStatusBanner("");

    const serialized = serializeGraph(
      graphRef.current.nodes,
      graphRef.current.edges
    );
    const idempotencyKey = pendingIdempotencyKey || createIdempotencyKey("att");
    setPendingIdempotencyKey(idempotencyKey);

    try {
      const savedAttempt = await saveProjectAttempt(projectId, {
        idempotency_key: idempotencyKey,
        snapshot: serialized as unknown as { nodes: Node[]; edges: Edge[] },
      });

      setPendingIdempotencyKey(null);
      setReadOnlySnapshot(false);
      await refreshAttempts();

      if (savedAttempt.evaluation_result) {
        setEvaluation(savedAttempt.evaluation_result);
      } else if (savedAttempt.score !== null) {
        setEvaluation({
          score: savedAttempt.score,
          grade: savedAttempt.grade ?? "C",
          passed: Boolean(savedAttempt.passed),
          summary: {
            critical: savedAttempt.summary?.critical ?? 0,
            errors: savedAttempt.summary?.errors ?? 0,
            warnings: savedAttempt.summary?.warnings ?? 0,
            info: savedAttempt.summary?.info ?? 0,
          },
          stats: {
            nodeCount: serialized.nodes.length,
            edgeCount: serialized.edges.length,
            componentCounts: {},
          },
          issues: savedAttempt.issues ?? [],
          engineVersion: savedAttempt.evaluation_engine_version ?? undefined,
          evaluatedAt: savedAttempt.saved_at,
        });
      }

      setEvaluationSource("saved_attempt");
      setActiveAttemptNumber(savedAttempt.attempt_number);
      setEvaluatedFingerprint(JSON.stringify(serialized));
      setStatusBanner(
        `Saved immutable Attempt #${savedAttempt.attempt_number} (Score: ${
          savedAttempt.score ?? "—"
        }/100).`
      );
    } catch (error) {
      setActionError(getErrorMessage(error, "Could not save attempt snapshot."));
    } finally {
      setSavingAttempt(false);
    }
  };

  // ------------------------------------------------------------------
  // Reopen / Load Attempt Snapshot into Canvas
  // ------------------------------------------------------------------
  const handleLoadAttempt = async (attemptId: string, asReadOnly: boolean) => {
    setActionError("");
    setStatusBanner("");
    try {
      const fullAttempt = await getAttemptById(attemptId);
      const restored = restoreGraph(
        fullAttempt.nodes_snapshot,
        fullAttempt.edges_snapshot
      );

      baselineSetRef.current = false;
      graphRef.current = restored;
      setInitialGraph(restored);
      setReadOnlySnapshot(asReadOnly);
      setCanvasKey(`loaded-${fullAttempt.id}-${asReadOnly ? "ro" : "edit"}`);

      if (!asReadOnly) {
        saveLocalDraft(projectId, restored.nodes, restored.edges, userId);
        setDraftState("saved");
      }

      if (fullAttempt.evaluation_result) {
        setEvaluation(fullAttempt.evaluation_result);
        setEvaluationSource("saved_attempt");
        setActiveAttemptNumber(fullAttempt.attempt_number);
        setEvaluatedFingerprint(getGraphFingerprint(restored.nodes, restored.edges));
        setRightTab("evaluation");
      }

      setStatusBanner(
        asReadOnly
          ? `Inspecting read-only Attempt #${fullAttempt.attempt_number} snapshot.`
          : `Restored Attempt #${fullAttempt.attempt_number} into working draft.`
      );
    } catch (error) {
      setActionError(getErrorMessage(error, "Failed to load attempt snapshot."));
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    setActionError("");
    try {
      await deleteAttemptById(attemptId);
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
    } catch (error) {
      setActionError(getErrorMessage(error, "Failed to delete attempt."));
    }
  };

  const handleResetToSavedOrEmpty = () => {
    clearLocalDraft(projectId, userId);
    const latest = attempts[0];
    const restored = latest
      ? restoreGraph(latest.nodes_snapshot, latest.edges_snapshot)
      : { nodes: [], edges: [] };

    baselineSetRef.current = false;
    graphRef.current = restored;
    setInitialGraph(restored);
    setReadOnlySnapshot(false);
    setDraftState("saved");
    setLastDraftSavedAt(null);
    setCanvasKey(`reset-${Date.now()}`);
    setStatusBanner(
      latest
        ? `Cleared local draft and reset to Attempt #${latest.attempt_number}.`
        : "Cleared local draft and reset canvas."
    );
  };

  // ------------------------------------------------------------------
  // Practice Rule Selections
  // ------------------------------------------------------------------
  const handleToggleRule = (ruleId: string) => {
    setRuleSelections((prev) =>
      prev.map((item) =>
        item.rule_id === ruleId && !item.is_mandatory
          ? { ...item, is_selected: !item.is_selected }
          : item
      )
    );
  };

  const handleSaveRuleSelections = async () => {
    if (!projectId) return;
    setSavingRules(true);
    setActionError("");
    try {
      const updated = await updateProjectRuleSelections(projectId, {
        selections: ruleSelections.map((r) => ({
          rule_id: r.rule_id,
          is_selected: Boolean(r.is_mandatory || r.is_selected),
          config_override: r.config_override ?? {},
        })),
      });
      setRuleSelections(updated);
      setStatusBanner("Updated active rule set for this practice project.");
    } catch (error) {
      setActionError(getErrorMessage(error, "Failed to update practice rules."));
    } finally {
      setSavingRules(false);
    }
  };

  const handleSelectIssue = (issue: EvaluationIssue | null) => {
    setSelectedIssueId(issue?.id ?? null);
    setHighlightNodeIds(issue?.nodeIds ?? []);
  };

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    componentType: string
  ) => {
    event.dataTransfer.setData("application/reactflow", componentType);
    event.dataTransfer.effectAllowed = "move";
  };

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#090a0d] px-6 text-gray-100">
        <ErrorBanner message={loadError} className="max-w-md" />
        <Link
          href="/projects"
          className="btn-spectrum px-5 py-2.5 font-mono text-xs uppercase tracking-wider"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return <FullPageLoader label="INITIALIZING_WORKSPACE..." />;
  }

  const isPractice = project.project_mode === "practice";
  const isEvaluationStale =
    Boolean(evaluation) &&
    evaluatedFingerprint !== null &&
    evaluatedFingerprint !== currentFingerprint;

  const draftLabel = {
    saved: lastDraftSavedAt
      ? `Draft synced locally (${new Date(lastDraftSavedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })})`
      : "Local draft ready",
    unsaved: "Draft pending local save...",
    saving: "Syncing local draft...",
    error: "Local storage error",
  }[draftState];

  const draftColor = {
    saved: "text-emerald-400",
    unsaved: "text-amber-400",
    saving: "text-cyan-400",
    error: "text-rose-400",
  }[draftState];

  const tabs: Array<{
    id: RightTab;
    label: string;
    badge?: number | string;
    show?: boolean;
  }> = [
    { id: "components", label: "Nodes", show: true },
    {
      id: "evaluation",
      label: "Eval",
      badge: evaluation ? `${evaluation.score}` : undefined,
      show: true,
    },
    {
      id: "attempts",
      label: "Attempts",
      badge: attempts.length,
      show: true,
    },
    {
      id: "rules",
      label: "Rules",
      badge: ruleSelections.filter((r) => r.is_selected || r.is_mandatory).length,
      show: isPractice,
    },
  ];

  return (
    <div className="flex h-screen flex-col bg-[#090a0d] text-gray-100">
      {/* Top Telemetry IDE Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#1e222b] bg-[#0e1015] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/projects"
            aria-label="Back to projects"
            className="rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-2 text-gray-400 transition hover:border-cyan-400/50 hover:text-white"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-white">
                {project.title}
              </h1>
              <span
                className={`rounded-[2px] border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                  isPractice
                    ? "border-violet-500/40 bg-violet-950/30 text-violet-300"
                    : "border-cyan-500/40 bg-cyan-950/30 text-cyan-300"
                }`}
              >
                {isPractice ? "PRACTICE" : "CHALLENGE"}
              </span>
            </div>

            <p className={`flex items-center gap-1.5 font-mono text-[10px] ${draftColor}`}>
              {draftState === "saving" && <Spinner size={11} />}
              {draftState === "saved" && <Check size={11} />}
              <span>{draftLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={handleResetToSavedOrEmpty}
            title="Reset local draft"
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-gray-400 transition hover:border-[#2e3442] hover:text-gray-200"
          >
            <RotateCcw size={14} />
            <span className="hidden md:inline">Reset Draft</span>
          </button>

          <button
            type="button"
            onClick={handleEvaluate}
            disabled={evaluating}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-cyan-500/40 bg-cyan-950/25 px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-950/40 disabled:opacity-60"
          >
            {evaluating ? <Spinner size={14} /> : <Play size={14} />}
            <span>{evaluating ? "Evaluating..." : "Evaluate"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAttempt}
            disabled={savingAttempt}
            className="btn-spectrum inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition hover:brightness-110 disabled:opacity-60"
          >
            {savingAttempt ? <Spinner size={14} /> : <BookmarkCheck size={14} />}
            <span>{savingAttempt ? "Saving..." : "Save Attempt"}</span>
          </button>
        </div>
      </header>

      {statusBanner && (
        <div className="shrink-0 border-b border-emerald-500/30 bg-emerald-950/25 px-6 py-2 font-mono text-xs text-emerald-300">
          [OK] {statusBanner}
        </div>
      )}

      {actionError && (
        <div className="shrink-0 border-b border-rose-500/40 bg-rose-950/30 px-6 py-2 font-mono text-xs text-rose-300">
          [ERR] {actionError}
        </div>
      )}

      <main className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Context Rail: Challenge Spec or Practice Sandbox Info */}
        <aside
          style={{ width: left.width }}
          className="relative shrink-0 overflow-y-auto border-r border-[#1e222b] bg-[#0e1015]"
        >
          <div className="p-5">
            {isPractice ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-widest text-violet-400">
                  [PRACTICE_SANDBOX_MODE]
                </p>
                <h2 className="mt-1.5 text-lg font-bold uppercase text-white">
                  Freeform Architecture Lab
                </h2>
                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Design open-ended distributed systems and select which
                  practice rules should be evaluated against your graph.
                </p>

                <div className="mt-5 rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-3.5">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-cyan-400">
                    <Sliders size={13} />
                    <span>ACTIVE_RULE_SET</span>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    Open the <strong className="text-gray-200">Rules</strong>{" "}
                    tab on the right rail to toggle optional evaluation rules
                    for this workspace.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
                  [CHALLENGE_SPECIFICATION]
                </p>
                <h2 className="mt-1.5 text-lg font-bold text-white">
                  {challenge?.title || project.challenge_title || "Loading spec..."}
                </h2>

                {challenge && (
                  <>
                    <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] uppercase">
                      <span className="rounded-[2px] border border-[#2e3442] bg-[#14171f] px-2 py-0.5 text-gray-300">
                        {challenge.difficulty}
                      </span>
                      {challenge.category && (
                        <span className="rounded-[2px] border border-[#2e3442] bg-[#14171f] px-2 py-0.5 text-amber-400">
                          {challenge.category}
                        </span>
                      )}
                      {challenge.estimated_minutes != null && (
                        <span className="rounded-[2px] border border-[#2e3442] bg-[#14171f] px-2 py-0.5 text-gray-400">
                          {challenge.estimated_minutes}m
                        </span>
                      )}
                    </div>

                    <section className="mt-6">
                      <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-200">
                        [01 // PROBLEM_STATEMENT]
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-gray-400">
                        {challenge.description}
                      </p>
                    </section>

                    {challenge.requirements && challenge.requirements.length > 0 && (
                      <section className="mt-6">
                        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-200">
                          [02 // REQUIREMENTS]
                        </h3>
                        <ul className="mt-2.5 space-y-2">
                          {challenge.requirements.map((req, idx) => (
                            <li
                              key={idx}
                              className="flex gap-2 rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-2.5 text-xs leading-5 text-gray-300"
                            >
                              <span className="font-mono text-[10px] text-emerald-400">
                                {idx + 1}.
                              </span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {challenge.hints && challenge.hints.length > 0 && (
                      <section className="mt-6">
                        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-200">
                          [03 // HINTS]
                        </h3>
                        <ul className="mt-2.5 space-y-2">
                          {challenge.hints.map((hint, idx) => (
                            <li
                              key={idx}
                              className="flex gap-2 text-xs leading-5 text-gray-400"
                            >
                              <span className="font-mono text-amber-400">→</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <div
            onMouseDown={left.startDragging}
            className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition ${
              left.dragging ? "bg-cyan-400" : "bg-transparent hover:bg-cyan-400/50"
            }`}
          />
        </aside>

        {/* Center React Flow Canvas */}
        <section className="min-w-0 flex-1 overflow-hidden">
          <WorkspaceCanvas
            snapshotKey={canvasKey}
            initialNodes={initialGraph.nodes}
            initialEdges={initialGraph.edges}
            onGraphChange={handleGraphChange}
            highlightNodeIds={highlightNodeIds}
            readOnly={readOnlySnapshot}
          />
        </section>

        {/* Right Inspector Rail: Nodes / Evaluation / Attempts / Practice Rules */}
        <aside
          style={{ width: right.width }}
          className="relative flex shrink-0 flex-col border-l border-[#1e222b] bg-[#0e1015]"
        >
          <div
            onMouseDown={right.startDragging}
            className={`absolute left-0 top-0 z-50 h-full w-1 cursor-col-resize transition ${
              right.dragging ? "bg-cyan-400" : "bg-transparent hover:bg-cyan-400/50"
            }`}
          />

          <div className="flex shrink-0 border-b border-[#1e222b] bg-[#090a0d]">
            {tabs
              .filter((t) => t.show !== false)
              .map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider transition ${
                    rightTab === tab.id
                      ? "border-b-2 border-cyan-400 bg-[#0e1015] text-cyan-300"
                      : "text-gray-500 hover:text-gray-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="rounded-[2px] border border-[#1e222b] bg-[#14171f] px-1.5 py-0.2 text-[9px] text-gray-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {rightTab === "components" && (
              <div className="p-4">
                <p className="font-mono text-[11px] leading-5 text-gray-400">
                  Drag components onto the canvas and connect handles. Select an
                  element and press Backspace/Delete to remove.
                </p>

                <div className="mt-4 space-y-2.5">
                  {architectureComponents.map((component) => (
                    <div
                      key={component.type}
                      draggable
                      onDragStart={(event) => onDragStart(event, component.type)}
                      className="cursor-grab overflow-hidden rounded-[2px] border border-[#1e222b] bg-[#090a0d] transition hover:border-cyan-400/50 active:cursor-grabbing"
                    >
                      <div className={`h-[2px] w-full ${component.colors.strip}`} />
                      <div className="flex items-center gap-3 p-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-[#1e222b] font-mono text-[11px] font-bold ${component.colors.iconBg} ${component.colors.text}`}
                        >
                          {component.short}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-100">
                            {component.name}
                          </p>
                          <p className="truncate font-mono text-[10px] text-gray-500">
                            {component.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightTab === "evaluation" && (
              <EvaluationPanel
                result={evaluation}
                evaluating={evaluating}
                onEvaluate={handleEvaluate}
                selectedIssueId={selectedIssueId}
                onSelectIssue={handleSelectIssue}
                sourceMode={evaluationSource}
                attemptNumber={activeAttemptNumber}
                isStale={isEvaluationStale}
              />
            )}

            {rightTab === "attempts" && (
              <div className="p-4">
                <div className="flex items-center justify-between border-b border-[#1e222b] pb-2.5">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-gray-100">
                    <History size={14} className="text-cyan-400" />
                    <span>[SAVED_ATTEMPTS]</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAttempt}
                    disabled={savingAttempt}
                    className="rounded-[2px] border border-cyan-500/40 bg-cyan-950/30 px-2.5 py-1 font-mono text-[10px] uppercase text-cyan-300 hover:bg-cyan-950/50"
                  >
                    + Commit Snapshot
                  </button>
                </div>

                {loadingAttempts ? (
                  <div className="mt-6 flex items-center justify-center gap-2 font-mono text-xs text-gray-400">
                    <Spinner size={14} /> LOADING_HISTORY...
                  </div>
                ) : attempts.length === 0 ? (
                  <div className="mt-5 rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-4 text-center font-mono text-xs text-gray-500">
                    No immutable attempts saved yet. Click{" "}
                    <span className="text-cyan-400">Save Attempt</span> in the
                    top bar to commit a snapshot.
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {attempts.map((att) => (
                      <li
                        key={att.id}
                        className="rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-gray-100">
                            ATTEMPT #{att.attempt_number}
                          </span>
                          <span
                            className={`rounded-[2px] border px-2 py-0.5 font-mono text-[10px] ${
                              att.passed
                                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                                : "border-amber-500/40 bg-amber-950/30 text-amber-300"
                            }`}
                          >
                            {att.score != null
                              ? `${att.score}/100 (${att.grade ?? "—"})`
                              : "UNSCORED"}
                          </span>
                        </div>

                        <p className="mt-1 font-mono text-[10px] text-gray-500">
                          {new Date(att.saved_at).toLocaleString()}
                        </p>

                        <div className="mt-3 flex items-center gap-2 border-t border-[#1e222b] pt-2.5">
                          <button
                            type="button"
                            onClick={() => handleLoadAttempt(att.id, false)}
                            className="flex-1 rounded-[2px] border border-cyan-500/40 bg-cyan-950/25 px-2.5 py-1.5 font-mono text-[10px] uppercase text-cyan-300 hover:bg-cyan-950/45"
                          >
                            Restore to Draft
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadAttempt(att.id, true)}
                            className="rounded-[2px] border border-[#2e3442] bg-[#0e1015] px-2.5 py-1.5 font-mono text-[10px] uppercase text-gray-300 hover:border-gray-500"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttempt(att.id)}
                            title="Delete attempt"
                            className="rounded-[2px] border border-[#1e222b] p-1.5 text-gray-500 hover:border-rose-500/40 hover:text-rose-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {rightTab === "rules" && isPractice && (
              <div className="p-4">
                <div className="flex items-center justify-between border-b border-[#1e222b] pb-2.5">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-100">
                    [PRACTICE_RULES]
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveRuleSelections}
                    disabled={savingRules}
                    className="btn-spectrum px-3 py-1 font-mono text-[10px] uppercase tracking-wider disabled:opacity-60"
                  >
                    {savingRules ? "Saving..." : "Apply Rules"}
                  </button>
                </div>

                {loadingRules ? (
                  <div className="mt-6 flex items-center justify-center gap-2 font-mono text-xs text-gray-400">
                    <Spinner size={14} /> LOADING_RULES...
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {ruleSelections.map((rule) => {
                      const active = Boolean(rule.is_mandatory || rule.is_selected);
                      return (
                        <li
                          key={rule.rule_id}
                          className="rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-3"
                        >
                          <label className="flex items-start gap-2.5 text-xs">
                            <input
                              type="checkbox"
                              checked={active}
                              disabled={Boolean(rule.is_mandatory)}
                              onChange={() => handleToggleRule(rule.rule_id)}
                              className="mt-0.5 accent-cyan-400"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-gray-100">
                                  {rule.name || rule.rule_key}
                                </span>
                                {rule.is_mandatory && (
                                  <span className="rounded-[2px] border border-amber-500/40 bg-amber-950/30 px-1.5 py-0.5 font-mono text-[9px] uppercase text-amber-300">
                                    MANDATORY
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 font-mono text-[10px] text-gray-500">
                                {rule.rule_key}
                              </p>
                              {rule.description && (
                                <p className="mt-1 text-[11px] text-gray-400">
                                  {rule.description}
                                </p>
                              )}
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}