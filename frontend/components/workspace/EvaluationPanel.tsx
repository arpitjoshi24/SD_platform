"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Play,
} from "lucide-react";

import Spinner from "@/components/ui/Spinner";
import type {
  EvaluationIssue,
  EvaluationResult,
  IssueSeverity,
} from "@/types/evaluation";

const severityStyle: Record<
  IssueSeverity,
  { icon: typeof Info; box: string; icon_c: string; label: string }
> = {
  critical: {
    icon: AlertCircle,
    box: "border-rose-900/70 bg-rose-950/30",
    icon_c: "text-rose-400",
    label: "Critical",
  },
  error: {
    icon: AlertCircle,
    box: "border-red-900/60 bg-red-950/20",
    icon_c: "text-red-400",
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    box: "border-yellow-900/60 bg-yellow-950/20",
    icon_c: "text-yellow-400",
    label: "Warning",
  },
  info: {
    icon: Info,
    box: "border-blue-900/60 bg-blue-950/20",
    icon_c: "text-blue-400",
    label: "Note",
  },
};

const gradeColor: Record<string, string> = {
  A: "text-green-400",
  B: "text-lime-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

interface Props {
  result: EvaluationResult | null;
  evaluating: boolean;
  onEvaluate: () => void;
  selectedIssueId: string | null;
  onSelectIssue: (issue: EvaluationIssue | null) => void;
  sourceMode?: "transient" | "saved_attempt";
  attemptNumber?: number | null;
  isStale?: boolean;
}

export default function EvaluationPanel({
  result,
  evaluating,
  onEvaluate,
  selectedIssueId,
  onSelectIssue,
  sourceMode = "transient",
  attemptNumber = null,
  isStale = false,
}: Props) {
  if (!result) {
    return (
      <div className="p-5">
        <h2 className="font-semibold">Evaluation</h2>

        <p className="mt-2 text-sm leading-5 text-gray-500">
          Check your design against the challenge requirements and common
          architecture rules.
        </p>

        <button
          type="button"
          onClick={onEvaluate}
          disabled={evaluating}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:opacity-60"
        >
          {evaluating ? <Spinner size={16} /> : <Play size={16} />}
          {evaluating ? "Evaluating..." : "Evaluate design"}
        </button>
      </div>
    );
  }

  const normalizedSeverity = (sev: string): IssueSeverity => {
    if (sev === "critical" || sev === "error" || sev === "warning" || sev === "info") {
      return sev;
    }
    return "warning";
  };

  return (
    <div className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider">
        <span
          className={`rounded-[2px] border px-2 py-0.5 ${
            sourceMode === "saved_attempt"
              ? "border-cyan-500/40 bg-cyan-950/30 text-cyan-300"
              : "border-gray-700 bg-gray-900 text-gray-400"
          }`}
        >
          {sourceMode === "saved_attempt" && attemptNumber != null
            ? `SAVED_ATTEMPT #${attemptNumber}`
            : "TRANSIENT_PREVIEW"}
        </span>

        {isStale && (
          <span className="rounded-[2px] border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-amber-300">
            GRAPH_CHANGED (STALE)
          </span>
        )}
      </div>

      {/* Score */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Score</p>

            <p className="mt-1 text-5xl font-bold">
              {result.score}
              <span className="text-lg font-normal text-gray-500">/100</span>
            </p>
          </div>

          <p className={`text-5xl font-bold ${gradeColor[result.grade] ?? "text-gray-200"}`}>
            {result.grade}
          </p>
        </div>

        <div
          className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
            result.passed
              ? "bg-green-950 text-green-400"
              : "bg-red-950 text-red-400"
          }`}
        >
          {result.passed ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {result.passed ? "Requirements met" : "Needs work"}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
          {Boolean(result.summary.critical) && (
            <span>{result.summary.critical} critical</span>
          )}
          <span>{result.summary.errors} errors</span>
          <span>{result.summary.warnings} warnings</span>
          <span>{result.summary.info} notes</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onEvaluate}
        disabled={evaluating}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium transition hover:bg-gray-900 disabled:opacity-60"
      >
        {evaluating ? <Spinner size={16} /> : <Play size={16} />}
        {evaluating ? "Evaluating..." : "Re-evaluate"}
      </button>

      {/* Issues */}
      {result.issues.length === 0 ? (
        <p className="mt-6 text-sm text-green-400">
          No issues found. Nice design!
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {result.issues.map((issue) => {
            const style = severityStyle[normalizedSeverity(issue.severity)];
            const Icon = style.icon;
            const selected = issue.id === selectedIssueId;
            const clickable = issue.nodeIds.length > 0;

            return (
              <li key={issue.id}>
                <button
                  type="button"
                  onClick={() => onSelectIssue(selected ? null : issue)}
                  disabled={!clickable}
                  className={`w-full rounded-xl border p-4 text-left transition ${style.box} ${
                    selected ? "ring-2 ring-amber-400/70" : ""
                  } ${
                    clickable
                      ? "cursor-pointer hover:brightness-125"
                      : "cursor-default"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={18} className={`mt-0.5 shrink-0 ${style.icon_c}`} />

                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{issue.title}</p>

                      <p className="mt-1 text-xs leading-5 text-gray-400">
                        {issue.message}
                      </p>

                      {issue.suggestion && (
                        <p className="mt-2 text-xs leading-5 text-gray-300">
                          <span className="font-medium text-gray-200">Fix: </span>
                          {issue.suggestion}
                        </p>
                      )}

                      {clickable && (
                        <p className="mt-2 text-[11px] text-gray-500">
                          {selected
                            ? "Click to clear highlight"
                            : "Click to highlight on canvas"}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}