"use client"

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  User,
  X,
} from "lucide-react";

import Logo from "@/components/ui/Logo";
import { useAuthStore, getDefaultRouteForUser } from "@/stores/auth.store";

const userNavigation = [
  { code: "01", name: "Challenges", href: "/challenges", icon: LayoutDashboard },
  { code: "02", name: "Projects", href: "/projects", icon: FolderKanban },
  { code: "03", name: "Profile", href: "/profile", icon: User },
];

function initials(name?: string) {
  if (!name) return "??";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isAdmin = user?.role === "admin";
  const homeHref = getDefaultRouteForUser(user);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 border-b border-[#1e222b] pb-5">
        <Logo href={homeHref} />
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
          {isAdmin ? "[ADMIN_TELEMETRY_SHELL]" : "[SYSTEM_DESIGN_LAB]"}
        </p>
      </div>

      <nav className="space-y-1.5">
        {userNavigation.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-[2px] border px-3.5 py-2.5 font-mono text-xs uppercase tracking-wider transition ${
                active
                  ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-300"
                  : "border-transparent text-gray-400 hover:border-[#1e222b] hover:bg-[#14171f] hover:text-gray-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={16} />
                <span>{item.name}</span>
              </span>
              <span className="text-[10px] text-gray-600">{item.code}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-3">
            <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-widest text-amber-400/80">
              [ADMIN_CONTROLS]
            </p>
            <Link
              href="/admin/dashboard"
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-[2px] border px-3.5 py-2.5 font-mono text-xs uppercase tracking-wider transition ${
                pathname.startsWith("/admin")
                  ? "border-amber-400/50 bg-amber-500/10 text-amber-300"
                  : "border-[#1e222b] bg-[#0e1015] text-amber-300/90 hover:border-amber-400/40 hover:bg-[#14171f]"
              }`}
            >
              <span className="flex items-center gap-3">
                <ShieldAlert size={16} />
                <span>Admin Console</span>
              </span>
              <span className="text-[10px]">ADM</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User + logout */}
      <div className="mt-auto border-t border-[#1e222b] pt-4">
        <div className="flex items-center gap-3 rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-cyan-400/40 bg-cyan-500/10 font-mono text-xs font-bold text-cyan-300">
            {initials(user?.full_name)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-100">
              {user?.full_name || "Operator"}
            </p>
            <p className="truncate font-mono text-[10px] text-gray-500">
              {user?.email || ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center gap-3 rounded-[2px] border border-transparent px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-gray-400 transition hover:border-rose-500/30 hover:bg-rose-950/20 hover:text-rose-400"
        >
          <LogOut size={16} />
          <span>Terminate Session</span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[#1e222b] bg-[#090a0d] p-4 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[#1e222b] bg-[#090a0d] px-4 md:hidden">
        <Logo href="/challenges" />

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-2 text-gray-300 hover:border-cyan-400/40 hover:text-white"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/75"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-72 border-r border-[#1e222b] bg-[#090a0d] p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-4 top-4 rounded-[2px] border border-[#1e222b] p-1.5 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}