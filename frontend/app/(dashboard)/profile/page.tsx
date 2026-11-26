"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  Check,
  FolderKanban,
  History,
  LogOut,
  Save,
} from "lucide-react";

import { useAuthStore } from "@/stores/auth.store";
import { updateMyProfile } from "@/services/user.service";
import { getMyActivity, getMyStatistics } from "@/services/activity.service";
import { getErrorMessage } from "@/lib/errors";
import type { ActivityHeatmapDay, UserStatistics } from "@/types/activity";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

function getHeatmapCellColor(count: number): string {
  if (count <= 0) return "bg-[#14171f] border-[#1e222b]";
  if (count === 1) return "bg-emerald-950 border-emerald-700/60";
  if (count === 2) return "bg-emerald-800/80 border-emerald-500/70";
  if (count <= 4) return "bg-emerald-500/80 border-emerald-400";
  return "bg-cyan-400 border-cyan-300";
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [timezone, setTimezone] = useState(user?.timezone ?? "UTC");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [activityDays, setActivityDays] = useState<ActivityHeatmapDay[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setTimezone(
        user.timezone ||
          (typeof Intl !== "undefined"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : "UTC")
      );
    }
  }, [user]);

  useEffect(() => {
    Promise.all([
      getMyStatistics().catch(() => null),
      getMyActivity({ days: 180 }).catch(() => null),
    ])
      .then(([statsData, activityData]) => {
        setStats(statsData);
        setActivityDays(activityData?.days ?? []);
      })
      .finally(() => setLoadingTelemetry(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSaved(false);
    setSavingProfile(true);

    try {
      const updated = await updateMyProfile({
        full_name: fullName.trim(),
        timezone: timezone.trim() || "UTC",
      });
      setUser(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(
        getErrorMessage(err, "Unable to update profile settings.")
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Build a clean 26-week (182-day) trailing grid merged with backend activity counts
  const heatmapGrid = useMemo(() => {
    const countMap = new Map(activityDays.map((d) => [d.date, d.count]));
    const days: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = 181; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({ date: iso, count: countMap.get(iso) ?? 0 });
    }
    return days;
  }, [activityDays]);

  const initials =
    user?.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? "??";

  const statCards = [
    {
      label: "TOTAL_PROJECTS",
      value: stats?.total_projects ?? "—",
      sub: stats
        ? `${stats.guided_projects} Guided • ${stats.practice_projects} Practice`
        : "Workspaces created",
      icon: FolderKanban,
      accent: "text-cyan-400",
    },
    {
      label: "SAVED_ATTEMPTS",
      value: stats?.total_attempts ?? "—",
      sub:
        stats?.average_score != null
          ? `Avg Score: ${Math.round(stats.average_score)}/100`
          : "Immutable snapshots",
      icon: History,
      accent: "text-amber-400",
    },
    {
      label: "CHALLENGES_PASSED",
      value: stats?.completed_challenges ?? "—",
      sub:
        stats?.best_score != null
          ? `Best Score: ${stats.best_score}/100`
          : "Completed specs",
      icon: Award,
      accent: "text-emerald-400",
    },
  ];

  return (
    <div className="min-h-screen bg-lab-grid px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="border-b border-[#1e222b] pb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
            [03 // OPERATOR_PROFILE &amp; TELEMETRY]
          </p>
          <h1 className="mt-1.5 text-3xl font-bold uppercase tracking-tight text-white">
            Profile &amp; Activity
          </h1>
          <p className="mt-1.5 text-sm text-gray-400">
            Account configuration, timezone preferences, and engineering
            practice telemetry.
          </p>
        </div>

        {/* Telemetry Metric Cards */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                    {card.label}
                  </span>
                  <Icon size={15} className={card.accent} />
                </div>
                <p className="mt-2 font-mono text-3xl font-bold text-white">
                  {loadingTelemetry ? "…" : card.value}
                </p>
                <p className="mt-1 font-mono text-[11px] text-gray-500">
                  {card.sub}
                </p>
              </div>
            );
          })}
        </section>

        {/* Activity Heatmap */}
        <section className="mt-6 rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e222b] pb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-100">
                [ACTIVITY_HEATMAP // LAST_180_DAYS]
              </h2>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-500">
              <span>LESS</span>
              <span className="h-2.5 w-2.5 border border-[#1e222b] bg-[#14171f]" />
              <span className="h-2.5 w-2.5 border border-emerald-700/60 bg-emerald-950" />
              <span className="h-2.5 w-2.5 border border-emerald-500/70 bg-emerald-800/80" />
              <span className="h-2.5 w-2.5 border border-emerald-400 bg-emerald-500/80" />
              <span className="h-2.5 w-2.5 border border-cyan-300 bg-cyan-400" />
              <span>MORE</span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <div className="grid min-w-[620px] grid-flow-col grid-rows-7 gap-1.5">
              {heatmapGrid.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} activity event(s)`}
                  className={`h-3.5 w-3.5 rounded-[1px] border transition ${getHeatmapCellColor(
                    day.count
                  )}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Account Details & Update Form */}
        <section className="mt-6 rounded-[2px] border border-[#1e222b] bg-[#0e1015]">
          <div className="flex items-center gap-4 border-b border-[#1e222b] p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[2px] border border-cyan-400/40 bg-cyan-500/10 font-mono text-lg font-bold text-cyan-300">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-white">
                  {user?.full_name}
                </h2>
                <span className="rounded-[2px] border border-cyan-500/40 bg-cyan-950/30 px-2 py-0.5 font-mono text-[10px] uppercase text-cyan-300">
                  {user?.role ?? "user"}
                </span>
                <span className="rounded-[2px] border border-emerald-500/40 bg-emerald-950/30 px-2 py-0.5 font-mono text-[10px] uppercase text-emerald-300">
                  {user?.account_status ?? "active"}
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-gray-500">
                {user?.email} • MEMBER SINCE {formatDate(user?.created_at)}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5 p-6">
            {profileError && <ErrorBanner message={profileError} />}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-gray-400"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label
                  htmlFor="timezone"
                  className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-gray-400"
                >
                  Timezone (IANA)
                </label>
                <input
                  id="timezone"
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Asia/Kolkata"
                  className="w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3.5 py-2.5 font-mono text-xs text-gray-100 outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#1e222b] pt-4">
              <div className="font-mono text-xs text-emerald-400">
                {profileSaved && (
                  <span className="inline-flex items-center gap-1.5">
                    <Check size={14} /> PROFILE_UPDATED
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="btn-spectrum inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs uppercase tracking-wider transition hover:brightness-110 disabled:opacity-60"
              >
                {savingProfile ? <Spinner size={14} /> : <Save size={14} />}
                <span>{savingProfile ? "SAVING..." : "SAVE_CHANGES"}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Session Termination */}
        <section className="mt-6 rounded-[2px] border border-rose-500/35 bg-rose-950/15 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-rose-300">
                [TERMINATE_SESSION]
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Clear local authentication tokens and sign out from this browser.
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-[2px] border border-rose-500/50 bg-rose-950/30 px-4 py-2 font-mono text-xs uppercase tracking-wider text-rose-300 transition hover:bg-rose-950/60"
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}