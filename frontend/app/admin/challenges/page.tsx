"use client";

import { useEffect, useState } from "react";
import { Archive, GitBranch, Plus, RefreshCw, RotateCcw } from "lucide-react";

import {
  archiveAdminChallenge,
  createAdminChallenge,
  createAdminChallengeVersion,
  getAdminChallenges,
  restoreAdminChallenge,
} from "@/services/admin.service";
import { getErrorMessage } from "@/lib/errors";
import type { Challenge } from "@/types/challenge";
import DifficultyBadge from "@/components/ui/DifficultyBadge";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

function extractChallengesArray(res: unknown): Challenge[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    const obj = res as {
      items?: unknown;
      challenges?: unknown;
      data?: unknown;
    };
    if (Array.isArray(obj.items)) return obj.items as Challenge[];
    if (Array.isArray(obj.challenges)) return obj.challenges as Challenge[];
    if (Array.isArray(obj.data)) return obj.data as Challenge[];
  }
  return [];
}

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // New Challenge Form
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium"
  );
  const [category, setCategory] = useState("Distributed Systems");
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [description, setDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [hintsText, setHintsText] = useState("");
  const [creating, setCreating] = useState(false);

  const loadList = () => {
    setLoading(true);
    setError("");
    getAdminChallenges({ include_archived: true })
      .then((res) => setChallenges(extractChallengesArray(res)))
      .catch((err) => {
        setChallenges([]);
        setError(getErrorMessage(err, "Failed to load admin challenges."));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setCreating(true);

    try {
      const requirements = requirementsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const hints = hintsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await createAdminChallenge({
        title: title.trim(),
        slug:
          slug.trim() ||
          title
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        difficulty,
        category: category.trim() || "Distributed Systems",
        estimated_minutes: Number(estimatedMinutes) || 45,
        description: description.trim(),
        requirements,
        hints,
        is_published: true,
      });

      setChallenges((prev) => [
        created,
        ...(Array.isArray(prev) ? prev : []),
      ]);
      setTitle("");
      setSlug("");
      setDescription("");
      setRequirementsText("");
      setHintsText("");
      setNotice(`Created challenge "${created.title}".`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create challenge."));
    } finally {
      setCreating(false);
    }
  };

  const handlePublishVersion = async (challenge: Challenge) => {
    setError("");
    setNotice("");
    try {
      await createAdminChallengeVersion(challenge.id, {
        title: challenge.title,
        description: challenge.description,
        requirements: challenge.requirements ?? [],
        hints: challenge.hints ?? [],
        changelog: "Published new specification version from admin console.",
      });
      await loadList();
      setNotice(`Published new version for "${challenge.title}".`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to publish new challenge version."));
    }
  };

  const handleToggleArchive = async (challenge: Challenge) => {
    setError("");
    setNotice("");
    try {
      const updated = challenge.is_archived
        ? await restoreAdminChallenge(challenge.id)
        : await archiveAdminChallenge(challenge.id);
      setChallenges((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) =>
          c.id === challenge.id ? { ...c, ...updated } : c
        )
      );
      setNotice(
        `${challenge.is_archived ? "Restored" : "Archived"} challenge "${
          challenge.title
        }".`
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update challenge archive status."));
    }
  };

  const challengeList = Array.isArray(challenges) ? challenges : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1e222b] pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
            [ADMIN // CHALLENGE_VERSION_REGISTRY]
          </p>
          <h1 className="mt-1.5 text-3xl font-bold uppercase tracking-tight text-white">
            Manage Challenges
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Author challenge specifications, publish immutable spec versions, and
            manage catalog visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={loadList}
          className="inline-flex items-center gap-2 rounded-[2px] border border-[#1e222b] bg-[#0e1015] px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-gray-300 hover:border-cyan-400/50"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <ErrorBanner message={error} className="mt-6" />}
      {notice && (
        <div className="mt-6 rounded-[2px] border border-emerald-500/40 bg-emerald-950/25 px-4 py-3 font-mono text-xs text-emerald-300">
          [OK] {notice}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Create Challenge Form */}
        <form
          onSubmit={handleCreateChallenge}
          className="space-y-4 rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-6 lg:col-span-5"
        >
          <div className="flex items-center gap-2 border-b border-[#1e222b] pb-3">
            <Plus size={16} className="text-cyan-400" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-100">
              [CREATE_NEW_CHALLENGE]
            </h2>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Distributed Rate Limiter"
              className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 text-xs text-gray-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as "Easy" | "Medium" | "Hard")
                }
                className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 font-mono text-xs text-gray-100 outline-none focus:border-cyan-400"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
                Est. Minutes
              </label>
              <input
                type="number"
                min={5}
                max={240}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 font-mono text-xs text-gray-100 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 text-xs text-gray-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Problem statement, scale targets, and throughput expectations..."
              className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 text-xs text-gray-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
              Requirements (One per line)
            </label>
            <textarea
              rows={3}
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              placeholder={"Sub-10ms p99 check latency\nNo single point of failure on API tier"}
              className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 font-mono text-xs text-gray-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase text-gray-400">
              Hints (One per line)
            </label>
            <textarea
              rows={2}
              value={hintsText}
              onChange={(e) => setHintsText(e.target.value)}
              placeholder="Consider token-bucket counters in low-latency memory"
              className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-2 font-mono text-xs text-gray-100 outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="btn-spectrum flex w-full items-center justify-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider disabled:opacity-60"
          >
            {creating && <Spinner size={14} />}
            <span>{creating ? "PUBLISHING..." : "CREATE_CHALLENGE"}</span>
          </button>
        </form>

        {/* Challenges List */}
        <div className="space-y-4 lg:col-span-7">
          {loading ? (
            <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
              <Spinner /> LOADING_CHALLENGES...
            </div>
          ) : challengeList.length === 0 ? (
            <div className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-8 text-center font-mono text-xs text-gray-500">
              No challenges found.
            </div>
          ) : (
            challengeList.map((ch) => {
              const ver =
                ch.current_version?.version_number ??
                ch.current_version_number ??
                1;

              return (
                <div
                  key={ch.id}
                  className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <DifficultyBadge difficulty={ch.difficulty} />
                      <span className="rounded-[2px] border border-cyan-500/40 bg-cyan-950/30 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                        v{ver}
                      </span>
                      {ch.is_archived && (
                        <span className="rounded-[2px] border border-rose-500/40 bg-rose-950/30 px-2 py-0.5 font-mono text-[10px] uppercase text-rose-300">
                          ARCHIVED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePublishVersion(ch)}
                        className="inline-flex items-center gap-1 rounded-[2px] border border-cyan-500/40 bg-cyan-950/25 px-2.5 py-1 font-mono text-[10px] uppercase text-cyan-300 hover:bg-cyan-950/45"
                      >
                        <GitBranch size={12} />
                        <span>New Version</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleArchive(ch)}
                        className="inline-flex items-center gap-1 rounded-[2px] border border-[#2e3442] bg-[#090a0d] px-2.5 py-1 font-mono text-[10px] uppercase text-gray-300 hover:border-rose-400/50 hover:text-rose-300"
                      >
                        {ch.is_archived ? (
                          <RotateCcw size={12} />
                        ) : (
                          <Archive size={12} />
                        )}
                        <span>{ch.is_archived ? "Restore" : "Archive"}</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-white">
                    {ch.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    {ch.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}