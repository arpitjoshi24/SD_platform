"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Boxes,
  LogOut,
  ShieldAlert,
  Sliders,
  Users,
} from "lucide-react";

import AuthGuard from "@/components/auth/AuthGuard";
import Logo from "@/components/ui/Logo";
import { useAuthStore } from "@/stores/auth.store";

const adminNav = [
  { code: "01", label: "Dashboard", href: "/admin/dashboard", icon: Activity },
  { code: "02", label: "Challenges", href: "/admin/challenges", icon: Boxes },
  { code: "03", label: "Rules", href: "/admin/rules", icon: Sliders },
  { code: "04", label: "Users", href: "/admin/users", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-[#090a0d] text-gray-100">
        {/* Top Admin Telemetry Bar */}
        <header className="sticky top-0 z-30 border-b border-[#1e222b] bg-[#0e1015]/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3">
            <div className="flex items-center gap-4">
              <Logo href="/admin/dashboard" />
              <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-amber-500/40 bg-amber-950/30 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                <ShieldAlert size={12} />
                ADMIN_CONSOLE
              </span>
            </div>

            <nav className="flex flex-wrap items-center gap-1.5">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-[2px] border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition ${
                      active
                        ? "border-amber-400/60 bg-amber-500/15 text-amber-300"
                        : "border-[#1e222b] bg-[#090a0d] text-gray-400 hover:border-[#2e3442] hover:text-gray-100"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2.5">
              <Link
                href="/challenges"
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-cyan-300 transition hover:border-cyan-400/50"
              >
                <ArrowLeft size={13} />
                <span>User Lab</span>
              </Link>

              <button
                type="button"
                onClick={logout}
                title={user?.email || "Sign out"}
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-rose-500/40 bg-rose-950/25 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-rose-300 transition hover:bg-rose-950/50"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="bg-lab-grid min-h-[calc(100vh-57px)]">{children}</main>
      </div>
    </AuthGuard>
  );
}