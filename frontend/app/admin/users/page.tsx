"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Shield, UserCheck, UserX } from "lucide-react";

import { getAdminUsers, updateAdminUserStatus } from "@/services/admin.service";
import { getErrorMessage } from "@/lib/errors";
import type { AdminUserRecord } from "@/types/admin";
import type { AccountStatus } from "@/types/auth";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

const statusBadge: Record<AccountStatus, string> = {
  active: "border-emerald-500/40 bg-emerald-950/30 text-emerald-300",
  suspended: "border-rose-500/40 bg-rose-950/30 text-rose-300",
  inactive: "border-amber-500/40 bg-amber-950/30 text-amber-300",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    getAdminUsers()
      .then(setUsers)
      .catch((err) =>
        setError(getErrorMessage(err, "Failed to load user accounts."))
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusChange = async (
    userId: string,
    nextStatus: AccountStatus
  ) => {
    setError("");
    setNotice("");
    setUpdatingId(userId);
    try {
      const updated = await updateAdminUserStatus(userId, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
      );
      setNotice(`Updated ${updated.email} status to ${nextStatus}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update account status."));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1e222b] pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
            [ADMIN // IDENTITY &amp; ACCOUNT_STATUS_CONTROL]
          </p>
          <h1 className="mt-1.5 text-3xl font-bold uppercase tracking-tight text-white">
            User Directory
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Inspect registered accounts, roles, project/attempt counts, and
            account status flags.
          </p>
        </div>

        <button
          type="button"
          onClick={loadUsers}
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

      <div className="mt-6 overflow-x-auto rounded-[2px] border border-[#1e222b] bg-[#0e1015]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 font-mono text-xs text-gray-400">
            <Spinner /> LOADING_USERS...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e222b] bg-[#090a0d] font-mono text-[10px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Telemetry</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e222b] text-xs">
              {users.map((u) => {
                const st: AccountStatus = u.account_status ?? "active";
                const busy = updatingId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-[#14171f]/60">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-100">
                        {u.full_name}
                      </p>
                      <p className="font-mono text-[11px] text-gray-500">
                        {u.email}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] uppercase">
                      <span
                        className={`inline-flex items-center gap-1 rounded-[2px] border px-2 py-0.5 ${
                          u.role === "admin"
                            ? "border-amber-500/40 bg-amber-950/30 text-amber-300"
                            : "border-cyan-500/40 bg-cyan-950/30 text-cyan-300"
                        }`}
                      >
                        <Shield size={11} />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[10px] uppercase">
                      <span
                        className={`rounded-[2px] border px-2 py-0.5 ${
                          statusBadge[st] ?? statusBadge.active
                        }`}
                      >
                        {st}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-gray-400">
                      {u.projects_count ?? 0} projects •{" "}
                      {u.attempts_count ?? 0} attempts
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {u.role === "admin" ? (
                        <span className="font-mono text-[10px] text-gray-600">
                          PROTECTED
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          {st !== "active" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleStatusChange(u.id, "active")}
                              className="inline-flex items-center gap-1 rounded-[2px] border border-emerald-500/40 bg-emerald-950/25 px-2.5 py-1 font-mono text-[10px] uppercase text-emerald-300 hover:bg-emerald-950/45 disabled:opacity-50"
                            >
                              <UserCheck size={12} />
                              <span>Activate</span>
                            </button>
                          )}
                          {st !== "suspended" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                handleStatusChange(u.id, "suspended")
                              }
                              className="inline-flex items-center gap-1 rounded-[2px] border border-rose-500/40 bg-rose-950/25 px-2.5 py-1 font-mono text-[10px] uppercase text-rose-300 hover:bg-rose-950/45 disabled:opacity-50"
                            >
                              <UserX size={12} />
                              <span>Suspend</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}