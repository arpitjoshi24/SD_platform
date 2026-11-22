"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getProjects } from "@/services/project.service";
import { getChallenges } from "@/services/challenge.service";
import { getErrorMessage } from "@/lib/errors";
import type { Project, ProjectStatus } from "@/types/project";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

const statusStyle: Record<ProjectStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-yellow-950 text-yellow-400" },
  submitted: { label: "Submitted", className: "bg-blue-950 text-blue-400" },
  completed: { label: "Completed", className: "bg-green-950 text-green-400" },
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [challengeTitles, setChallengeTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getProjects(), getChallenges()])
      .then(([projectList, challengeList]) => {
        setProjects(projectList);
        setChallengeTitles(
          Object.fromEntries(challengeList.map((c) => [c.id, c.title]))
        );
      })
      .catch((err) => setError(getErrorMessage(err, "Failed to load projects")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">My Projects</h1>
            <p className="mt-2 text-gray-400">
              Your architecture attempts and solutions.
            </p>
          </div>

          <Link
            href="/challenges"
            className="rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200"
          >
            Explore Challenges
          </Link>
        </div>

        {error && <ErrorBanner message={error} className="mt-8" />}

        {loading ? (
          <div className="mt-16 flex items-center justify-center gap-3 text-gray-400">
            <Spinner /> Loading projects...
          </div>
        ) : (
          <>
            {!error && projects.length === 0 && (
              <div className="mt-12 rounded-2xl border border-gray-800 bg-gray-900 p-12 text-center">
                <h2 className="text-2xl font-semibold">No projects yet</h2>

                <p className="mt-3 text-gray-400">
                  Start a challenge and create your first architecture.
                </p>

                <Link
                  href="/challenges"
                  className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200"
                >
                  Browse Challenges
                </Link>
              </div>
            )}

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const status = statusStyle[project.status] ?? statusStyle.draft;

                return (
                  <div
                    key={project.id}
                    className="flex flex-col rounded-2xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-600"
                  >
                    <h2 className="text-xl font-semibold">{project.title}</h2>

                    <p className="mt-2 text-sm text-gray-500">
                      {challengeTitles[project.challenge_id] ?? "Challenge"}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>

                      <span className="text-xs text-gray-500">
                        {formatDate(project.updated_at)}
                      </span>
                    </div>

                    <div className="mt-5 flex gap-4 text-sm text-gray-400">
                      <span>{project.nodes?.length ?? 0} components</span>
                      <span>{project.edges?.length ?? 0} connections</span>
                    </div>

                    <Link
                      href={`/workspace/${project.id}`}
                      className="mt-6 block w-full rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-gray-200"
                    >
                      {project.status === "completed"
                        ? "View Solution"
                        : "Continue Designing"}
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
