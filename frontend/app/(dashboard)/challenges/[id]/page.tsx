"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckSquare,
  Clock,
  FolderPlus,
  GitBranch,
  Layers,
  Lightbulb,
  Play,
} from "lucide-react";

import { getChallenge } from "@/services/challenge.service";
import { createProject, getProjects } from "@/services/project.service";
import { getErrorMessage } from "@/lib/errors";
import type { Challenge } from "@/types/challenge";
import type { ProjectWithSummary } from "@/types/project";
import DifficultyBadge from "@/components/ui/DifficultyBadge";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

export default function ChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const challengeId = params?.id;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [existingProjects, setExistingProjects] = useState<ProjectWithSummary[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [projectTitle, setProjectTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!challengeId) return;

    Promise.all([getChallenge(challengeId), getProjects().catch(() => [])])
      .then(([challengeData, projectsData]) => {
        setChallenge(challengeData);
        setProjectTitle(`${challengeData.title} — Solution`);
        setExistingProjects(
          projectsData.filter((p) => p.challenge_id === challengeData.id)
        );
      })
      .catch((err) =>
        setError(getErrorMessage(err, "Unable to load challenge details."))
      )
      .finally(() => setLoading(false));
  }, [challengeId]);

  const handleStartProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;

    setCreateError("");
    setCreating(true);

    try {
      const created = await createProject({
        project_mode: "challenge",
        challenge_id: challenge.id,
        title: projectTitle.trim() || `${challenge.title} — Solution`,
      });
      router.push(`/workspace/${created.id}`);
    } catch (err) {
      setCreateError(
        getErrorMessage(err, "Failed to initialize challenge workspace.")
      );
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center gap-3 font-mono text-xs uppercase tracking-wider text-gray-400">
        <Spinner /> <span>LOADING_SPECIFICATION...</span>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/challenges"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-gray-400 hover:text-white"
        >
          <ArrowLeft size={14} /> Back to Challenges
        </Link>
        <ErrorBanner
          message={error || "Challenge specification not found."}
          className="mt-6"
        />
      </div>
    );
  }

  const versionNumber =
    challenge.current_version?.version_number ??
    challenge.current_version_number ??
    1;

  return (
    <div className="min-h-screen bg-lab-grid px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/challenges"
          className="inline-flex items-center gap-2 rounded-[2px] border border-[#1e222b] bg-[#0e1015] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-gray-400 transition hover:border-cyan-400/50 hover:text-white"
        >
          <ArrowLeft size={14} />
          <span>Catalog</span>
        </Link>

        {/* Challenge Header Bento Card */}
        <section className="mt-5 rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={challenge.difficulty} />

            <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-cyan-500/40 bg-cyan-950/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
              <GitBranch size={11} />
              SPEC_VERSION v{versionNumber}
            </span>

            {challenge.estimated_minutes != null && (
              <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#1e222b] bg-[#14171f] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                <Clock size={11} />
                EST_{challenge.estimated_minutes}_MIN
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#1e222b] bg-[#14171f] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-400">
              <Layers size={11} />
              {challenge.category || "SYSTEM_DESIGN"}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
            {challenge.title}
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-300">
            {challenge.description}
          </p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left 2 Columns: Requirements & Hints */}
          <div className="space-y-6 lg:col-span-2">
            {/* Functional & Architectural Requirements */}
            <section className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-6">
              <div className="flex items-center gap-2 border-b border-[#1e222b] pb-3">
                <CheckSquare size={16} className="text-emerald-400" />
                <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-100">
                  [01 // ARCHITECTURAL_REQUIREMENTS]
                </h2>
              </div>

              {challenge.requirements && challenge.requirements.length > 0 ? (
                <ul className="mt-4 space-y-2.5">
                  {challenge.requirements.map((req, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-3 text-xs leading-5 text-gray-300"
                    >
                      <span className="font-mono text-[11px] font-semibold text-emerald-400">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-xs text-gray-500">
                  Design a fault-tolerant, scalable architecture satisfying
                  standard high-availability and decoupling rules.
                </p>
              )}
            </section>

            {/* Engineering Hints */}
            {challenge.hints && challenge.hints.length > 0 && (
              <section className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-6">
                <div className="flex items-center gap-2 border-b border-[#1e222b] pb-3">
                  <Lightbulb size={16} className="text-amber-400" />
                  <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-100">
                    [02 // DESIGN_HINTS]
                  </h2>
                </div>

                <ul className="mt-4 space-y-2">
                  {challenge.hints.map((hint, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs leading-5 text-gray-400"
                    >
                      <span className="font-mono text-amber-400">→</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Right Column: Launch New Workspace or Resume Existing */}
          <div className="space-y-6">
            <section className="rounded-[2px] border border-cyan-500/35 bg-[#0e1015] p-5">
              <div className="flex items-center gap-2 border-b border-[#1e222b] pb-3">
                <FolderPlus size={16} className="text-cyan-400" />
                <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-100">
                  [LAUNCH_WORKSPACE]
                </h2>
              </div>

              <p className="mt-3 text-xs leading-5 text-gray-400">
                Creates a new guided project locked to{" "}
                <span className="font-mono text-cyan-300">
                  v{versionNumber}
                </span>{" "}
                of this challenge specification.
              </p>

              {createError && (
                <ErrorBanner message={createError} className="mt-4" />
              )}

              <form onSubmit={handleStartProject} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="projectTitle"
                    className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-gray-400"
                  >
                    Project Workspace Title
                  </label>
                  <input
                    id="projectTitle"
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="My Architecture Solution"
                    className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2.5 text-xs text-gray-100 outline-none transition focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="btn-spectrum flex w-full items-center justify-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-wider transition hover:brightness-110 disabled:opacity-60"
                >
                  {creating ? <Spinner size={15} /> : <Play size={15} />}
                  <span>
                    {creating ? "PROVISIONING..." : "INITIALIZE_CANVAS →"}
                  </span>
                </button>
              </form>
            </section>

            {existingProjects.length > 0 && (
              <section className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-5">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-200">
                  [EXISTING_WORKSPACES ({existingProjects.length})]
                </h3>

                <ul className="mt-3 space-y-2.5">
                  {existingProjects.map((proj) => (
                    <li
                      key={proj.id}
                      className="rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-3"
                    >
                      <p className="truncate text-xs font-semibold text-gray-100">
                        {proj.title}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-gray-500">
                        <span>
                          {proj.total_attempts ?? 0} ATTEMPTS
                          {proj.latest_attempt?.score != null
                            ? ` • LAST: ${proj.latest_attempt.score}/100`
                            : ""}
                        </span>
                        <Link
                          href={`/workspace/${proj.id}`}
                          className="text-cyan-400 hover:underline"
                        >
                          OPEN →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}