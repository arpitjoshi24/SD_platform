"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Boxes,
  FolderKanban,
  History,
  Sliders,
  Users,
} from "lucide-react";

import { getAdminDashboardStats } from "@/services/admin.service";
import { getErrorMessage } from "@/lib/errors";
import type { AdminDashboardStats } from "@/types/admin";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDashboardStats()
      .then((res) => {
        if (!res) {
          setError("Unable to load admin dashboard metrics.");
        } else {
          setData(res);
        }
      })
      .catch((err) =>
        setError(getErrorMessage(err, "Failed to load admin telemetry."))
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 font-mono text-xs uppercase tracking-wider text-gray-400">
        <Spinner /> <span>AGGREGATING_PLATFORM_TELEMETRY...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <ErrorBanner
          message={error || "Unable to load admin dashboard metrics."}
        />
      </div>
    );
  }

  const kpis = [
    {
      label: "TOTAL_USERS",
      value: data.total_users,
      sub: `${data.active_users} Active • ${data.suspended_users} Suspended`,
      icon: Users,
      accent: "text-cyan-400",
      href: "/admin/users",
    },
    {
      label: "CHALLENGES",
      value: data.total_challenges,
      sub: `${data.published_challenges} Published Specs`,
      icon: Boxes,
      accent: "text-emerald-400",
      href: "/admin/challenges",
    },
    {
      label: "RULE_DEFINITIONS",
      value: data.total_rules,
      sub: `${data.active_rules} Active Engine Rules`,
      icon: Sliders,
      accent: "text-amber-400",
      href: "/admin/rules",
    },
    {
      label: "PROJECTS & ATTEMPTS",
      value: data.total_projects,
      sub: `${data.total_attempts} Immutable Attempts Saved`,
      icon: FolderKanban,
      accent: "text-violet-400",
      href: "/admin/dashboard",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1e222b] pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
            [ADMIN // SYSTEM_TELEMETRY_OVERVIEW]
          </p>
          <h1 className="mt-1.5 text-3xl font-bold uppercase tracking-tight text-white">
            Platform Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Operational counters across users, versioned challenges, rule sets,
            and saved architecture attempts.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
          <History size={14} className="text-cyan-400" />
          <span>AVG_SCORE: {Math.round(data.average_attempt_score ?? 0)}/100</span>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-5 transition hover:border-cyan-400/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                  {kpi.label}
                </span>
                <Icon size={16} className={kpi.accent} />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-white">
                {kpi.value}
              </p>
              <p className="mt-1.5 font-mono text-[11px] text-gray-400">
                {kpi.sub}
              </p>
            </Link>
          );
        })}
      </section>

      {/* Recent Activity Feed */}
      <section className="mt-8 rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-6">
        <div className="flex items-center gap-2 border-b border-[#1e222b] pb-3">
          <Activity size={16} className="text-emerald-400" />
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-100">
            [RECENT_PLATFORM_ACTIVITY]
          </h2>
        </div>

        {!data.recent_activity || data.recent_activity.length === 0 ? (
          <p className="mt-4 font-mono text-xs text-gray-500">
            No recent platform activity recorded.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#1e222b]">
            {data.recent_activity.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-mono text-[10px] uppercase text-cyan-400">
                    [{item.event_type}]
                  </span>{" "}
                  <span className="text-gray-200">{item.summary}</span>
                  {item.actor_email && (
                    <span className="ml-2 font-mono text-[11px] text-gray-500">
                      ({item.actor_email})
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}