"use client";

import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/auth.store";
import { getProjects } from "@/services/project.service";
import { LogOut } from "lucide-react";

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    getProjects()
      .then((projects) => {
        setProjectCount(projects.length);
        setCompletedCount(projects.filter((p) => p.status === "completed").length);
      })
      .catch(() => {
        // stats are optional; leave them as "—"
      });
  }, []);

  const initials =
    user?.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? "?";

  const fields = [
    { label: "Full name", value: user?.full_name },
    { label: "Email address", value: user?.email },
    { label: "Account role", value: user?.role },
    { label: "Member since", value: formatDate(user?.created_at) },
  ];

  const stats = [
    { label: "Projects", value: projectCount },
    { label: "Challenges completed", value: completedCount },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="mt-2 text-gray-400">Your ArchMentor account.</p>

      <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900">
        <div className="flex items-center gap-5 border-b border-gray-800 p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-bold text-black">
            {initials}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">{user?.full_name}</h2>
            <p className="mt-1 truncate text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label}>
              <p className="text-sm font-medium text-gray-300">{field.label}</p>

              <div className="mt-2 rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-sm capitalize text-gray-400">
                {field.value ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-800 bg-gray-900 p-5"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value ?? "—"}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-red-900/40 bg-red-950/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-gray-200">Sign out</p>
            <p className="mt-1 text-sm text-gray-500">Sign out from this device.</p>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/50"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}
