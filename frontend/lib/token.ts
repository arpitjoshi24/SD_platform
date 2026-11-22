const TOKEN_KEY = "token";

// Single place that touches localStorage for the JWT.
export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

export const UNAUTHORIZED_EVENT = "auth:unauthorized";
