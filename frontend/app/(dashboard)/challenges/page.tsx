"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Layers, Search, Sparkles } from "lucide-react";

import { getChallenges } from "@/services/challenge.service";
import { getErrorMessage } from "@/lib/errors";
import type { Challenge } from "@/types/challenge";
import ErrorBanner from "@/components/ui/ErrorBanner";
import DifficultyBadge from "@/components/ui/DifficultyBadge";
import Spinner from "@/components/ui/Spinner";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  useEffect(() => {
    getChallenges()
      .then(setChallenges)
      .catch((err) =>
        setError(getErrorMessage(err, "Failed to load challenges"))
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      if (c.is_archived) return false;
      if (
        difficultyFilter !== "all" &&
        c.difficulty.toLowerCase() !== difficultyFilter
      ) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q))
      );
    });
  }, [challenges, search, difficultyFilter]);

  return (
    <div className="min-h-screen bg-lab-grid px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Bar */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1e222b] pb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
              [01 // ARCHITECTURE_SPECIFICATIONS]
            </p>
            <h1 className="mt-1.5 text-3xl font-bold uppercase tracking-tight text-white">
              System Design Challenges
            </h1>
            <p className="mt-1.5 text-sm text-gray-400">
              Select a versioned problem spec, construct a distributed topology,
              and validate against deterministic architecture rules.
            </p>
          </div>

          <Link
            href="/projects?new=practice"
            className="inline-flex items-center gap-2 rounded-[2px] border border-emerald-500/40 bg-emerald-950/25 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-950/40"
          >
            <Sparkles size={14} />
            <span>Open Practice Sandbox</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter challenges by title, domain, or keyword..."
              className="w-full rounded-[2px] border border-[#1e222b] bg-[#0e1015] py-2.5 pl-10 pr-4 font-mono text-xs text-gray-100 outline-none transition placeholder:text-gray-600 focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {["all", "easy", "medium", "hard"].map((level) => {
              const active = difficultyFilter === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficultyFilter(level)}
                  className={`rounded-[2px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition ${
                    active
                      ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300"
                      : "border-[#1e222b] bg-[#0e1015] text-gray-400 hover:border-[#2e3442] hover:text-gray-200"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {error && <ErrorBanner message={error} className="mt-6" />}

        {loading ? (
          <div className="mt-16 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-wider text-gray-400">
            <Spinner /> <span>FETCHING_CHALLENGE_CATALOG...</span>
          </div>
        ) : (
          <>
            {!error && filteredChallenges.length === 0 && (
              <div className="mt-10 rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-10 text-center">
                <p className="font-mono text-xs uppercase tracking-wider text-gray-400">
                  [NO_MATCHING_CHALLENGES]
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Adjust your filters or launch a freeform practice sandbox to
                  test custom rule sets.
                </p>
              </div>
            )}

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredChallenges.map((challenge) => {
                const versionNumber =
                  challenge.current_version?.version_number ??
                  challenge.current_version_number ??
                  1;

                return (
                  <article
                    key={challenge.id}
                    className="flex flex-col rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-5 transition hover:border-cyan-400/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <DifficultyBadge difficulty={challenge.difficulty} />

                      <div className="flex items-center gap-2 font-mono text-[11px] text-gray-500">
                        <span className="rounded-[2px] border border-[#1e222b] bg-[#14171f] px-2 py-0.5 text-[10px] text-cyan-400">
                          v{versionNumber}
                        </span>
                        {challenge.estimated_minutes != null && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} />
                            {challenge.estimated_minutes}m
                          </span>
                        )}
                      </div>
                    </div>

                    <h2 className="mt-4 text-lg font-semibold text-gray-100">
                      {challenge.title}
                    </h2>

                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-400">
                      {challenge.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 border-t border-[#1e222b] pt-3 font-mono text-[11px] text-gray-500">
                      <Layers size={13} className="text-amber-400" />
                      <span>{challenge.category || "Distributed Systems"}</span>
                    </div>

                    <Link
                      href={`/challenges/${challenge.id}`}
                      className="btn-spectrum mt-5 block w-full px-4 py-2.5 text-center font-mono text-xs uppercase tracking-wider transition hover:brightness-110"
                    >
                      Inspect Spec &amp; Start →
                    </Link>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}