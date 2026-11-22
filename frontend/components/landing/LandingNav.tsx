"use client";

import { useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useAuthStore } from "@/stores/auth.store";

export default function LandingNav() {
  const status = useAuthStore((s) => s.status);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const loggedIn = status === "authenticated";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />

        <nav className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link
              href="/challenges"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition hover:text-white"
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
