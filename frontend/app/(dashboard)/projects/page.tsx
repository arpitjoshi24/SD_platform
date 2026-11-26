"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  FolderKanban,
  History,
  Plus,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

import {
  archiveProject,
  createProject,
  getProjects,
} from "@/services/project.service";
import { getPracticeRules } from "@/services/rule.service";
import { getErrorMessage } from "@/lib/errors";
import type { ProjectStatus, ProjectWithSummary } from "@/types/project";
import type { RuleDefinition } from "@/types/rule";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

const statusStyle: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  in_progress: {
    label: "IN_PROGRESS",
    className: "border-cyan-500/40 bg-cyan-950/30 text-cyan-300",
  },
  completed: {
    label: "COMPLETED",
    className: "border-emerald-500/40 bg-emerald-950/30 text-emerald-300",
  },
  archived: {
    label: "ARCHIVED",
    className: "border-gray-600/40 bg-gray-900 text-gray-400",
  },
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<ProjectWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "challenge" | "practice">(
    "all"
  );
  const [showArchived, setShowArchived] = useState(false);

  // Practice Sandbox Modal State
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [practiceTitle, setPracticeTitle] = useState("Practice Architecture Sandbox");
  const [practiceRules, setPracticeRules] = useState<RuleDefinition[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());
  const [loadingRules, setLoadingRules] = useState(false);
  const [creatingPractice, setCreatingPractice] = useState(false);
  const [practiceError, setPracticeError] = useState("");

  const loadProjects = () => {
    setLoading(true);
    getProjects()
      .then(setProjects)
      .catch((err) => setError(getErrorMessage(err, "Failed to load projects")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "practice") {
      openPracticeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openPracticeModal = async () => {
    setPracticeModalOpen(true);
    setPracticeError("");
    if (practiceRules.length > 0) return;

    setLoadingRules(true);
    try {
      const rules = await getPracticeRules();
      setPracticeRules(rules);
      // Pre-select mandatory rules
      const mandatoryIds = new Set(
        rules.filter((r) => r.is_mandatory).map((r) => r.id)
      );
      setSelectedRuleIds(mandatoryIds);
    } catch (err) {
      setPracticeError(
        getErrorMessage(err, "Could not load configurable practice rules.")
      );
    } finally {
      setLoadingRules(false);
    }
  };

  const toggleRuleSelection = (rule: RuleDefinition) => {
    if (rule.is_mandatory) return;
    setSelectedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(rule.id)) {
        next.delete(rule.id);
      } else {
        next.add(rule.id);
      }
      return next;
    });
  };

  const handleCreatePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    setPracticeError("");
    setCreatingPractice(true);

    try {
      const selected_rules = practiceRules.map((rule) => ({
        rule_id: rule.id,
        is_selected: rule.is_mandatory || selectedRuleIds.has(rule.id),
      }));

      const created = await createProject({
        project_mode: "practice",
        title: practiceTitle.trim() || "Practice Architecture Sandbox",
        selected_rules,
      });

      router.push(`/workspace/${created.id}`);
    } catch (err) {
      setPracticeError(
        getErrorMessage(err, "Failed to create practice sandbox.")
      );
      setCreatingPractice(false);
    }
  };

  const handleArchive = async (projectId: string) => {
    try {
      const updated = await archiveProject(projectId);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: updated.status } : p))
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to archive project."));
    }
  };

  const visibleProjects = useMemo(() => {
    return projects.filter((p) => {
      if (!showArchived && p.status === "archived") return false;
      if (modeFilter !== "all" && p.project_mode !== modeFilter) return false;
      return true;
    });
  }, [projects, modeFilter, showArchived]);

  return (
    <div className="min-h-screen bg-lab-grid px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1e222b] pb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
              [02 // WORKSPACE_INVENTORY]
            </p>
            <h1 className="mt-1.5 text-3xl font-bold uppercase tracking-tight text-white">
              My Projects
            </h1>
            <p className="mt-1.5 text-sm text-gray-400">
              Guided challenge solutions and freeform practice sandboxes with
              immutable saved attempts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openPracticeModal}
              className="inline-flex items-center gap-2 rounded-[2px] border border-emerald-500/40 bg-emerald-950/25 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-950/40"
            >
              <Plus size={14} />
              <span>New Practice Sandbox</span>
            </button>

            <Link
              href="/challenges"
              className="btn-spectrum inline-flex items-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition hover:brightness-110"
            >
              <span>Browse Challenges →</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: "ALL_PROJECTS" },
                { id: "challenge", label: "GUIDED_CHALLENGES" },
                { id: "practice", label: "PRACTICE_SANDBOXES" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModeFilter(tab.id)}
                className={`rounded-[2px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition ${
                  modeFilter === tab.id
                    ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300"
                    : "border-[#1e222b] bg-[#0e1015] text-gray-400 hover:border-[#2e3442] hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-xs text-gray-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="accent-cyan-400"
            />
            <span>SHOW_ARCHIVED</span>
          </label>
        </div>

        {error && <ErrorBanner message={error} className="mt-6" />}

        {loading ? (
          <div className="mt-16 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-wider text-gray-400">
            <Spinner /> <span>LOADING_PROJECTS...</span>
          </div>
        ) : (
          <>
            {!error && visibleProjects.length === 0 && (
              <div className="mt-10 rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-12 text-center">
                <FolderKanban
                  size={28}
                  className="mx-auto text-gray-600"
                />
                <h2 className="mt-3 font-mono text-sm font-semibold uppercase tracking-wider text-gray-200">
                  No Active Workspaces Found
                </h2>
                <p className="mt-2 text-xs text-gray-500">
                  Start from a guided system design challenge or create a
                  freeform practice sandbox.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={openPracticeModal}
                    className="rounded-[2px] border border-emerald-500/40 bg-emerald-950/25 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-emerald-300 hover:border-emerald-400"
                  >
                    Create Practice Sandbox
                  </button>
                  <Link
                    href="/challenges"
                    className="btn-spectrum px-5 py-2.5 font-mono text-xs uppercase tracking-wider"
                  >
                    Explore Challenges
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleProjects.map((project) => {
                const status =
                  statusStyle[project.status] ?? statusStyle.in_progress;
                const isPractice = project.project_mode === "practice";
                const latest = project.latest_attempt;

                return (
                  <article
                    key={project.id}
                    className="flex flex-col rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-5 transition hover:border-cyan-400/50"
                  >
                    {/* Mode + Status Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-[2px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                          isPractice
                            ? "border-violet-500/40 bg-violet-950/30 text-violet-300"
                            : "border-amber-500/40 bg-amber-950/30 text-amber-300"
                        }`}
                      >
                        {isPractice ? (
                          <Sparkles size={10} />
                        ) : (
                          <Shield size={10} />
                        )}
                        {isPractice ? "PRACTICE" : "CHALLENGE"}
                      </span>

                      <span
                        className={`rounded-[2px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <h2 className="mt-4 line-clamp-1 text-base font-semibold text-gray-100">
                      {project.title}
                    </h2>

                    <p className="mt-1 truncate font-mono text-[11px] text-gray-500">
                      {isPractice
                        ? "Freeform Rule-Configurable Sandbox"
                        : project.challenge_title
                        ? `${project.challenge_title}${
                            project.challenge_version_number
                              ? ` (v${project.challenge_version_number})`
                              : ""
                          }`
                        : "Guided Challenge"}
                    </p>

                    {/* Latest Attempt Telemetry Box */}
                    <div className="mt-4 rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-3">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="inline-flex items-center gap-1.5 text-gray-400">
                          <History size={12} className="text-cyan-400" />
                          {project.total_attempts ?? 0} SAVED ATTEMPTS
                        </span>

                        {latest && latest.score !== null ? (
                          <span
                            className={`font-semibold ${
                              latest.passed
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            #{latest.attempt_number}: {latest.score}/100 (
                            {latest.grade})
                          </span>
                        ) : (
                          <span className="text-gray-600">NO_ATTEMPTS</span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-[#1e222b] pt-2 font-mono text-[10px] text-gray-500">
                        <span>UPDATED {formatDate(project.updated_at)}</span>
                        {latest?.passed && (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 size={11} /> PASSED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex items-center gap-2 pt-5">
                      <Link
                        href={`/workspace/${project.id}`}
                        className="btn-spectrum flex-1 px-4 py-2.5 text-center font-mono text-xs uppercase tracking-wider transition hover:brightness-110"
                      >
                        Open Workspace →
                      </Link>

                      {project.status !== "archived" && (
                        <button
                          type="button"
                          onClick={() => handleArchive(project.id)}
                          title="Archive project"
                          className="rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-2.5 text-gray-400 transition hover:border-rose-500/40 hover:text-rose-400"
                        >
                          <Archive size={15} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Practice Sandbox Creation Modal */}
      {practiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2px] border border-[#2e3442] bg-[#0e1015] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e222b] pb-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                  [PRACTICE_SANDBOX_PROVISIONER]
                </p>
                <h2 className="mt-1 text-lg font-bold uppercase text-white">
                  Create Practice Project
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setPracticeModalOpen(false)}
                className="rounded-[2px] border border-[#1e222b] p-1.5 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {practiceError && (
              <ErrorBanner message={practiceError} className="mt-4" />
            )}

            <form onSubmit={handleCreatePractice} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="practiceTitle"
                  className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-gray-400"
                >
                  Sandbox Title
                </label>
                <input
                  id="practiceTitle"
                  type="text"
                  value={practiceTitle}
                  onChange={(e) => setPracticeTitle(e.target.value)}
                  placeholder="e.g., High-Throughput Event Pipeline"
                  className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3.5 py-2.5 text-xs text-gray-100 outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
                    Evaluation Rule Set (Mandatory + Optional)
                  </span>
                  <span className="font-mono text-[10px] text-cyan-400">
                    {selectedRuleIds.size} SELECTED
                  </span>
                </div>

                {loadingRules ? (
                  <div className="flex items-center gap-2 rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-4 font-mono text-xs text-gray-400">
                    <Spinner size={14} /> LOADING_PRACTICE_RULES...
                  </div>
                ) : (
                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-3">
                    {practiceRules.map((rule) => {
                      const checked =
                        rule.is_mandatory || selectedRuleIds.has(rule.id);

                      return (
                        <label
                          key={rule.id}
                          className={`flex items-start gap-3 rounded-[2px] border p-2.5 text-xs transition ${
                            checked
                              ? "border-cyan-500/35 bg-cyan-950/15"
                              : "border-[#1e222b] bg-[#0e1015]"
                          } ${
                            rule.is_mandatory
                              ? "cursor-not-allowed opacity-90"
                              : "cursor-pointer hover:border-[#2e3442]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={rule.is_mandatory}
                            onChange={() => toggleRuleSelection(rule)}
                            className="mt-0.5 accent-cyan-400"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-100">
                                {rule.name}
                              </span>
                              <span className="font-mono text-[10px] text-gray-500">
                                [{rule.rule_key}]
                              </span>
                              {rule.is_mandatory && (
                                <span className="rounded-[2px] border border-amber-500/40 bg-amber-950/30 px-1.5 py-0.5 font-mono text-[9px] uppercase text-amber-300">
                                  MANDATORY
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-gray-400">
                              {rule.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#1e222b] pt-4">
                <button
                  type="button"
                  onClick={() => setPracticeModalOpen(false)}
                  className="rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-4 py-2 font-mono text-xs uppercase tracking-wider text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPractice}
                  className="btn-spectrum inline-flex items-center gap-2 px-5 py-2 font-mono text-xs uppercase tracking-wider disabled:opacity-60"
                >
                  {creatingPractice && <Spinner size={14} />}
                  <span>
                    {creatingPractice ? "CREATING..." : "LAUNCH_SANDBOX →"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}