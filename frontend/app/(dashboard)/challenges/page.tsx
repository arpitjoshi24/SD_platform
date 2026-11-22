"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  useEffect(() => {
    getChallenges()
      .then(setChallenges)
      .catch((err) => setError(getErrorMessage(err, "Failed to load challenges")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">System Design Challenges</h1>

        <p className="mt-2 text-gray-400">
          Choose a challenge and start designing your architecture.
        </p>

        {error && <ErrorBanner message={error} className="mt-6" />}

        {loading ? (
          <div className="mt-16 flex items-center justify-center gap-3 text-gray-400">
            <Spinner /> Loading challenges...
          </div>
        ) : (
          <>
            {!error && challenges.length === 0 && (
              <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
                No challenges published yet.
              </div>
            )}

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex flex-col rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <DifficultyBadge difficulty={challenge.difficulty} />

                    <span className="text-sm text-gray-500">
                      {challenge.estimated_time} min
                    </span>
                  </div>

                  <h2 className="mt-5 text-xl font-semibold">{challenge.title}</h2>

                  <p className="mt-3 line-clamp-3 text-sm text-gray-400">
                    {challenge.description}
                  </p>

                  <p className="mt-5 text-sm text-gray-500">{challenge.category}</p>

                  <Link
                    href={`/challenges/${challenge.id}`}
                    className="mt-auto block w-full rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-gray-200"
                  >
                    View Challenge
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
