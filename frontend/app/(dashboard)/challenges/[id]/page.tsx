"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getChallenge } from "@/services/challenge.service";
import { createProject } from "@/services/project.service";
import { getErrorMessage } from "@/lib/errors";
import type { Challenge } from "@/types/challenge";
import ErrorBanner from "@/components/ui/ErrorBanner";
import DifficultyBadge from "@/components/ui/DifficultyBadge";
import Spinner from "@/components/ui/Spinner";

export default function ChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  useEffect(() => {
    getChallenge(params.id)
      .then(setChallenge)
      .catch((err) => setLoadError(getErrorMessage(err, "Failed to load challenge")))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleStartDesigning = async () => {
    if (!challenge) return;

    setStarting(true);
    setStartError("");

    try {
      const project = await createProject({
        challenge_id: challenge.id,
        title: `${challenge.title} Architecture`,
      });

      router.push(`/workspace/${project.id}`);
    } catch (err) {
      setStartError(getErrorMessage(err, "Failed to start designing"));
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-gray-400">
        <Spinner /> Loading challenge...
      </div>
    );
  }

  if (loadError || !challenge) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold">{loadError || "Challenge not found"}</h1>

        <Link
          href="/challenges"
          className="mt-6 rounded-lg bg-white px-5 py-3 font-semibold text-black"
        >
          Back to Challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/challenges" className="text-sm text-gray-400 hover:text-white">
        ← Back to Challenges
      </Link>

      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <DifficultyBadge difficulty={challenge.difficulty} />

          <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
            {challenge.category}
          </span>

          <span className="text-sm text-gray-500">
            {challenge.estimated_time} minutes
          </span>
        </div>

        <h1 className="mt-5 text-4xl font-bold">{challenge.title}</h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-400">
          {challenge.description}
        </p>
      </div>

      <section className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-2xl font-semibold">Requirements</h2>

        <ul className="mt-5 space-y-3">
          {challenge.requirements?.map((requirement, index) => (
            <li key={index} className="flex gap-3 text-gray-300">
              <span className="text-gray-500">•</span>
              {requirement}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-2xl font-semibold">Hints</h2>

        <ul className="mt-5 space-y-3">
          {challenge.hints?.map((hint, index) => (
            <li key={index} className="flex gap-3 text-gray-400">
              <span className="text-gray-500">•</span>
              {hint}
            </li>
          ))}
        </ul>
      </section>

      {startError && <ErrorBanner message={startError} className="mt-6" />}

      <div className="mt-10 flex justify-end">
        <button
          onClick={handleStartDesigning}
          disabled={starting}
          className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {starting && <Spinner />}
          {starting ? "Creating project..." : "Start Designing →"}
        </button>
      </div>
    </div>
  );
}
