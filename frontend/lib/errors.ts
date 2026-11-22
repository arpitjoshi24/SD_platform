import axios from "axios";

/**
 * Turns any thrown value into a message that is safe to show to a user.
 * Uses the backend's `message` when there is one.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.message;

    if (typeof serverMessage === "string" && serverMessage) {
      return serverMessage;
    }

    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the server. Check that the backend is running.";
    }

    if (error.code === "ECONNABORTED") {
      return "The request took too long. Please try again.";
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/** Only allow redirects to paths inside this app (prevents open redirects). */
export function getSafeRedirect(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
