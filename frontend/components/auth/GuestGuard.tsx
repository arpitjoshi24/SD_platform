"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { getSafeRedirect } from "@/lib/errors";
import FullPageLoader from "@/components/ui/FullPageLoader";

/**
 * Wrap login / register. Already signed in -> go to the app.
 * This is also what moves the user forward right after a successful login,
 * so there is exactly one place that decides where to go next.
 */
export default function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = useAuthStore((s) => s.status);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(getSafeRedirect(searchParams.get("next")) ?? "/challenges");
    }
  }, [status, searchParams, router]);

  if (status === "idle" || status === "loading" || status === "authenticated") {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
