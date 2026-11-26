import axios from "axios";
import { tokenStorage, UNAUTHORIZED_EVENT } from "@/lib/token";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Expired / invalid session: drop the token and tell the app.
// A wrong password on /auth/login or /auth/register must NOT dispatch unauthorized.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? "";
    const isAuthAttempt =
      url.includes("/auth/login") || url.includes("/auth/register");

    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !isAuthAttempt &&
      tokenStorage.get()
    ) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default api;