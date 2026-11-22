"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Edge, Node } from "@xyflow/react";
import { ArrowLeft, Check, Play, Save } from "lucide-react";

import WorkspaceCanvas from "@/components/workspace/WorkspaceCanvas";
import EvaluationPanel from "@/components/workspace/EvaluationPanel";
import ErrorBanner from "@/components/ui/ErrorBanner";
import FullPageLoader from "@/components/ui/FullPageLoader";
import Spinner from "@/components/ui/Spinner";
import { architectureComponents } from "@/data/architectureComponents";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { getChallenge } from "@/services/challenge.service";
import {
  evaluateProject,
  getProject,
  updateProject,
} from "@/services/project.service";
import { getErrorMessage } from "@/lib/errors";
import { serializeGraph } from "@/lib/graph";
import type { Challenge } from "@/types/challenge";
import type { Project } from "@/types/project";
import type { EvaluationIssue, EvaluationResult } from "@/types/evaluation";

type SaveState = "saved" | "unsaved" | "saving" | "error";

const AUTOSAVE_DELAY_MS = 2000;

export default function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loadError, setLoadError] = useState("");

  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [actionError, setActionError] = useState("");

  const [rightTab, setRightTab] = useState<"components" | "evaluation">("components");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [highlightNodeIds, setHighlightNodeIds] = useState<string[]>([]);

  const left = useResizablePanel({ initial: 320, min: 240, max: 500, side: "left" });
  const right = useResizablePanel({ initial: 340, min: 260, max: 480, side: "right" });

  // Latest canvas state lives in refs so typing/dragging does not re-render the page
  const graphRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const lastSavedRef = useRef("");
  const baselineSetRef = useRef(false);
  const inFlightRef = useRef<Promise<boolean> | null>(null);

  // ------------------------------------------------------------------
  // Load project + its challenge
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const loaded = await getProject(projectId);
        if (cancelled) return;
        setProject(loaded);

        const loadedChallenge = await getChallenge(loaded.challenge_id);
        if (!cancelled) setChallenge(loadedChallenge);
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error, "Failed to load this project"));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ------------------------------------------------------------------
  // Saving
  // ------------------------------------------------------------------
  const currentJson = () =>
    JSON.stringify(serializeGraph(graphRef.current.nodes, graphRef.current.edges));

  const handleGraphChange = useCallback((nodes: Node[], edges: Edge[]) => {
    graphRef.current = { nodes, edges };

    const json = JSON.stringify(serializeGraph(nodes, edges));

    // The first report after loading is the saved design itself
    if (!baselineSetRef.current) {
      baselineSetRef.current = true;
      lastSavedRef.current = json;
      return;
    }

    setSaveState(json === lastSavedRef.current ? "saved" : "unsaved");
  }, []);

  /**
   * Returns true when the design is safely stored.
   * If a save is already running we wait for it, then save again only if needed.
   */
  const save = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) {
      await inFlightRef.current;
    }

    const snapshot = currentJson();

    if (snapshot === lastSavedRef.current) {
      setSaveState("saved");
      return true;
    }

    const run = (async () => {
      setSaveState("saving");
      setActionError("");

      try {
        await updateProject(
          projectId,
          serializeGraph(graphRef.current.nodes, graphRef.current.edges)
        );

        lastSavedRef.current = snapshot;
        // Did the user keep editing while we were saving?
        setSaveState(currentJson() === snapshot ? "saved" : "unsaved");
        return true;
      } catch (error) {
        setSaveState("error");
        setActionError(getErrorMessage(error, "Could not save your design"));
        return false;
      }
    })();

    inFlightRef.current = run;

    try {
      return await run;
    } finally {
      if (inFlightRef.current === run) inFlightRef.current = null;
    }
  }, [projectId]);

  // Autosave shortly after the user stops editing
  useEffect(() => {
    if (saveState !== "unsaved") return;

    const timer = setTimeout(() => {
      save();
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [saveState, save]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState === "unsaved" || saveState === "saving" || saveState === "error") {
        event.preventDefault();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState]);

  // Ctrl/Cmd + S
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  // ------------------------------------------------------------------
  // Evaluate
  // ------------------------------------------------------------------
  const handleEvaluate = async () => {
    setEvaluating(true);
    setActionError("");
    setRightTab("evaluation");

    // The engine evaluates the SAVED design, so save first.
    const saved = await save();

    if (!saved) {
      setEvaluating(false);
      return;
    }

    try {
      const result = await evaluateProject(projectId);
      setEvaluation(result);
      setSelectedIssueId(null);
      setHighlightNodeIds([]);
    } catch (error) {
      setActionError(getErrorMessage(error, "Evaluation failed"));
    } finally {
      setEvaluating(false);
    }
  };

  const handleSelectIssue = (issue: EvaluationIssue | null) => {
    setSelectedIssueId(issue?.id ?? null);
    setHighlightNodeIds(issue?.nodeIds ?? []);
  };

  // ------------------------------------------------------------------
  // Drag from palette
  // ------------------------------------------------------------------
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, componentType: string) => {
    event.dataTransfer.setData("application/reactflow", componentType);
    event.dataTransfer.effectAllowed = "move";
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 px-6 text-white">
        <ErrorBanner message={loadError} className="max-w-md" />

        <Link
          href="/projects"
          className="rounded-lg bg-white px-5 py-3 font-semibold text-black"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return <FullPageLoader label="Loading workspace..." />;
  }

  const saveLabel = {
    saved: "All changes saved",
    unsaved: "Unsaved changes",
    saving: "Saving...",
    error: "Save failed",
  }[saveState];

  const saveLabelColor = {
    saved: "text-gray-500",
    unsaved: "text-yellow-400",
    saving: "text-gray-400",
    error: "text-red-400",
  }[saveState];

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-gray-800 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/projects"
            aria-label="Back to projects"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-900 hover:text-white"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="min-w-0">
            <h1 className="truncate font-semibold">{project.title}</h1>
            <p className={`flex items-center gap-1.5 text-xs ${saveLabelColor}`}>
              {saveState === "saving" && <Spinner size={12} />}
              {saveState === "saved" && <Check size={12} />}
              {saveLabel}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => save()}
            disabled={saveState === "saved" || saveState === "saving"}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={16} />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:opacity-60"
          >
            {evaluating ? <Spinner size={16} /> : <Play size={16} />}
            Evaluate
          </button>
        </div>
      </header>

      {actionError && (
        <div className="shrink-0 border-b border-red-900/50 bg-red-950/30 px-6 py-2 text-sm text-red-400">
          {actionError}
        </div>
      )}

      <main className="flex min-h-0 flex-1 overflow-hidden">
        {/* Challenge panel */}
        <aside
          style={{ width: left.width }}
          className="relative shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-950"
        >
          <div className="p-6">
            <p className="text-xs uppercase tracking-wider text-gray-500">Challenge</p>

            <h2 className="mt-2 text-xl font-semibold">
              {challenge?.title || "Loading challenge..."}
            </h2>

            {challenge && (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
                    {challenge.difficulty}
                  </span>
                  <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
                    {challenge.category}
                  </span>
                  <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
                    {challenge.estimated_time} min
                  </span>
                </div>

                <section className="mt-7">
                  <h3 className="text-sm font-semibold">Problem</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-400">
                    {challenge.description}
                  </p>
                </section>

                <section className="mt-7">
                  <h3 className="text-sm font-semibold">Requirements</h3>
                  <ul className="mt-3 space-y-3">
                    {challenge.requirements?.map((requirement, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-5 text-gray-400">
                        <span className="text-gray-600">•</span>
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-7">
                  <h3 className="text-sm font-semibold">Hints</h3>
                  <ul className="mt-3 space-y-3">
                    {challenge.hints?.map((hint, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-5 text-gray-500">
                        <span>•</span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>

          <div
            onMouseDown={left.startDragging}
            className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition ${
              left.dragging ? "bg-white" : "bg-transparent hover:bg-gray-600"
            }`}
          />
        </aside>

        {/* Canvas */}
        <section className="min-w-0 flex-1 overflow-hidden">
          <WorkspaceCanvas
            initialNodes={project.nodes}
            initialEdges={project.edges}
            onGraphChange={handleGraphChange}
            highlightNodeIds={highlightNodeIds}
          />
        </section>

        {/* Right panel: components / evaluation */}
        <aside
          style={{ width: right.width }}
          className="relative flex shrink-0 flex-col border-l border-gray-800 bg-gray-950"
        >
          <div
            onMouseDown={right.startDragging}
            className={`absolute left-0 top-0 z-50 h-full w-1 cursor-col-resize transition ${
              right.dragging ? "bg-white" : "bg-transparent hover:bg-gray-600"
            }`}
          />

          <div className="flex shrink-0 border-b border-gray-800">
            {(["components", "evaluation"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition ${
                  rightTab === tab
                    ? "border-b-2 border-white text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {rightTab === "components" ? (
              <div className="p-5">
                <p className="text-sm leading-5 text-gray-500">
                  Drag a component onto the canvas. Connect them by dragging from
                  one dot to another. Press Backspace to delete a selection.
                </p>

                <div className="mt-6 space-y-3">
                  {architectureComponents.map((component) => (
                    <div
                      key={component.type}
                      draggable
                      onDragStart={(event) => onDragStart(event, component.type)}
                      className="cursor-grab rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-600 hover:bg-gray-800 active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${component.colors.iconBg} ${component.colors.text}`}
                        >
                          {component.short}
                        </div>

                        <div>
                          <p className="text-sm font-medium">{component.name}</p>
                          <p className="text-xs text-gray-500">{component.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EvaluationPanel
                result={evaluation}
                evaluating={evaluating}
                onEvaluate={handleEvaluate}
                selectedIssueId={selectedIssueId}
                onSelectIssue={handleSelectIssue}
              />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
