const TOKEN_KEY = "token";

// Single place that touches localStorage for the JWT.
export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  set(token: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignore storage quota or private-mode errors
    }
  },

  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};

export const UNAUTHORIZED_EVENT = "auth:unauthorized";

export function createIdempotencyKey(prefix = "attempt"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}