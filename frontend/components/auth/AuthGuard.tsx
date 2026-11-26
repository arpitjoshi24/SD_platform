"use client"

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, getDefaultRouteForUser } from "@/stores/auth.store";
import { UNAUTHORIZED_EVENT } from "@/lib/token";
import type { UserRole } from "@/types/auth";
import FullPageLoader from "@/components/ui/FullPageLoader";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

/**
 * Protects authenticated routes in the browser and enforces role boundaries
 * (e.g., preventing standard 'user' accounts from accessing '/admin/*').
 */
export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const signedOut = useAuthStore((s) => s.signedOut);
  const initialize = useAuthStore((s) => s.initialize);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth("Your session has expired. Please sign in again.");
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearAuth]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(
        signedOut ? "/login" : `/login?next=${encodeURIComponent(pathname)}`
      );
      return;
    }

    if (status === "authenticated" && user) {
      if (user.account_status && user.account_status !== "active") {
        clearAuth(
          user.account_status === "suspended"
            ? "Your account has been suspended."
            : "Your account is inactive."
        );
        router.replace("/login");
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        router.replace(getDefaultRouteForUser(user));
      }
    }
  }, [status, user, signedOut, pathname, requiredRole, router, clearAuth]);

  if (status === "idle" || status === "loading" || status === "unauthenticated") {
    return <FullPageLoader label="VERIFYING_SESSION..." />;
  }

  if (!user || (requiredRole && user.role !== requiredRole)) {
    return <FullPageLoader label="CHECKING_PERMISSIONS..." />;
  }

  return <>{children}</>;
}