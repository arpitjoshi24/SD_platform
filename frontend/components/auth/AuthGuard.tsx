"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { UNAUTHORIZED_EVENT } from "@/lib/token";
import FullPageLoader from "@/components/ui/FullPageLoader";

/**
 * Wrap pages that need a logged-in user.
 * Token lives in localStorage, so the check has to run in the browser
 * (a server-side proxy cannot read it).
 */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const status = useAuthStore((s) => s.status);
  const signedOut = useAuthStore((s) => s.signedOut);
  const initialize = useAuthStore((s) => s.initialize);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // The API client fires this when the server says the session is invalid/expired
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clearAuth);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearAuth);
  }, [clearAuth]);

  useEffect(() => {
    if (status !== "unauthenticated") return;

    router.replace(
      signedOut ? "/login" : `/login?next=${encodeURIComponent(pathname)}`
    );
  }, [status, signedOut, pathname, router]);

  if (status !== "authenticated") {
    return <FullPageLoader label="Checking your session..." />;
  }

  return <>{children}</>;
}
