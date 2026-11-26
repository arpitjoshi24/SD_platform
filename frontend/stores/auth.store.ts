"use client";

import { create } from "zustand";
import type { User } from "@/types/auth";
import { tokenStorage } from "@/lib/token";
import { getCurrentUser, logoutUser } from "@/services/auth.service";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  /** true after an explicit logout (so we don't add ?next= to the login URL) */
  signedOut: boolean;
  /** Optional status/rejection reason (e.g., suspended account) */
  authNotice: string | null;

  /** Restore the session from the saved token (runs once per page load). */
  initialize: () => Promise<void>;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  clearAuth: (notice?: string | null) => void;
  logout: () => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const getDefaultRouteForUser = (user: User | null): string => {
  if (!user) return "/login";
  return user.role === "admin" ? "/admin/dashboard" : "/challenges";
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  status: "idle",
  signedOut: false,
  authNotice: null,

  initialize: () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const token = tokenStorage.get();

      if (!token) {
        set({ status: "unauthenticated", authNotice: null });
        return;
      }

      set({ status: "loading", token, authNotice: null });

      try {
        const user = await getCurrentUser();
        if (user.account_status && user.account_status !== "active") {
          tokenStorage.clear();
          initPromise = null;
          set({
            user: null,
            token: null,
            status: "unauthenticated",
            authNotice:
              user.account_status === "suspended"
                ? "Your account has been suspended."
                : "Your account is not active.",
          });
          return;
        }

        set({ user, token, status: "authenticated", authNotice: null });
      } catch {
        tokenStorage.clear();
        initPromise = null;
        set({ user: null, token: null, status: "unauthenticated" });
      }
    })();

    return initPromise;
  },

  setAuth: (user, token) => {
    initPromise = null;
    tokenStorage.set(token);
    set({
      user,
      token,
      status: "authenticated",
      signedOut: false,
      authNotice: null,
    });
  },

  setUser: (user) => {
    set({ user });
  },

  clearAuth: (notice = null) => {
    initPromise = null;
    tokenStorage.clear();
    set({
      user: null,
      token: null,
      status: "unauthenticated",
      authNotice: notice,
    });
  },

  logout: async () => {
    try {
      await logoutUser();
    } catch {
      // Even if the request fails we still sign out locally.
    }

    get().clearAuth(null);
    set({ signedOut: true });
  },
}));