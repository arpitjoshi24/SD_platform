"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

export default function LandingCta({ className = "" }: { className?: string }) {
  const loggedIn = useAuthStore((s) => s.status === "authenticated");

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <Link
        href={loggedIn ? "/challenges" : "/register"}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
      >
        {loggedIn ? "Open challenges" : "Get started free"}
        <ArrowRight size={18} />
      </Link>

      {!loggedIn && (
        <Link
          href="/login"
          className="rounded-lg border border-gray-700 px-6 py-3 font-medium text-gray-200 transition hover:border-gray-500 hover:bg-gray-900"
        >
          I already have an account
        </Link>
      )}
    </div>
  );
}
