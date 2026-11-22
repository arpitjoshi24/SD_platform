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

  /** Restore the session from the saved token (runs once per page load). */
  initialize: () => Promise<void>;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  status: "idle",
  signedOut: false,

  initialize: () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const token = tokenStorage.get();

      if (!token) {
        set({ status: "unauthenticated" });
        return;
      }

      set({ status: "loading", token });

      try {
        const user = await getCurrentUser();
        set({ user, token, status: "authenticated" });
      } catch {
        tokenStorage.clear();
        set({ user: null, token: null, status: "unauthenticated" });
      }
    })();

    return initPromise;
  },

  setAuth: (user, token) => {
    tokenStorage.set(token);
    set({ user, token, status: "authenticated", signedOut: false });
  },

  clearAuth: () => {
    tokenStorage.clear();
    set({ user: null, token: null, status: "unauthenticated" });
  },

  logout: async () => {
    try {
      await logoutUser(); // clears the fallback cookie on the server
    } catch {
      // Even if the request fails we still sign out locally.
    }

    get().clearAuth();
    set({ signedOut: true });
  },
}));
