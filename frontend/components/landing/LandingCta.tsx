"use client"

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuthStore, getDefaultRouteForUser } from "@/stores/auth.store";

export default function LandingCta({ className = "" }: { className?: string }) {
  const user = useAuthStore((s) => s.user);
  const loggedIn = useAuthStore((s) => s.status === "authenticated");

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <Link
        href={loggedIn ? getDefaultRouteForUser(user) : "/register"}
        className="inline-flex items-center gap-2 rounded-[2px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#090a0d] transition hover:brightness-110"
      >
        <span>{loggedIn ? "Launch Lab" : "Explore Lab"}</span>
        <ArrowRight size={16} />
      </Link>

      {!loggedIn && (
        <Link
          href="/login"
          className="rounded-[2px] border border-[#2e3442] bg-[#0e1015] px-6 py-3 font-mono text-xs uppercase tracking-wider text-gray-200 transition hover:border-cyan-400/50 hover:bg-[#14171f]"
        >
          Existing Account ↗
        </Link>
      )}
    </div>
  );
}