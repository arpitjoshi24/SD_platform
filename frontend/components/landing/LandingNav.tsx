"use client"

import { useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useAuthStore, getDefaultRouteForUser } from "@/stores/auth.store";

export default function LandingNav() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const loggedIn = status === "authenticated";
  const dashboardHref = getDefaultRouteForUser(user);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1e222b] bg-[#090a0d]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />

        <nav className="hidden items-center gap-8 font-mono text-xs uppercase tracking-wider text-gray-400 md:flex">
          <a href="#features" className="transition hover:text-cyan-400">
            01 // Rules &amp; Sim
          </a>
          <a href="#how-it-works" className="transition hover:text-emerald-400">
            02 // Workflow
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link
              href={dashboardHref}
              className="rounded-[2px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#090a0d] transition hover:brightness-110"
            >
              Open Console →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-[2px] border border-transparent px-4 py-2 font-mono text-xs uppercase tracking-wider text-gray-300 transition hover:border-[#1e222b] hover:text-white"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="rounded-[2px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#090a0d] transition hover:brightness-110"
              >
                Register →
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}