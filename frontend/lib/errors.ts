import axios from "axios";
import type { ApiErrorResponse } from "@/types/api";

/**
 * Turns any thrown value into a message that is safe to show to a user.
 * Uses the backend's `message` (and field details when available).
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    const serverMessage = data?.message;

    if (Array.isArray(data?.details) && data.details.length > 0) {
      const firstDetail = data.details[0]?.message;
      if (firstDetail) {
        return serverMessage ? `${serverMessage}: ${firstDetail}` : firstDetail;
      }
    }

    if (typeof serverMessage === "string" && serverMessage.trim()) {
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