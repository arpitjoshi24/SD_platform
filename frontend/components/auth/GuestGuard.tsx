"use client"

import { useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, getDefaultRouteForUser } from "@/stores/auth.store";
import { getSafeRedirect } from "@/lib/errors";
import FullPageLoader from "@/components/ui/FullPageLoader";

/**
 * Wrap login / register pages. Already-authenticated users are routed to
 * their role-appropriate home (or a safe ?next= path if permitted for their role).
 */
export default function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (status === "authenticated" && user) {
      const safeNext = getSafeRedirect(searchParams.get("next"));
      const defaultRoute = getDefaultRouteForUser(user);

      if (safeNext && (user.role === "admin" || !safeNext.startsWith("/admin"))) {
        router.replace(safeNext);
      } else {
        router.replace(defaultRoute);
      }
    }
  }, [status, user, searchParams, router]);

  if (status === "idle" || status === "loading" || status === "authenticated") {
    return <FullPageLoader label="PREPARING_LAB..." />;
  }

  return <>{children}</>;
}