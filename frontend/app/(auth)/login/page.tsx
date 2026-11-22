"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginUser } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { getErrorMessage } from "@/lib/errors";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validation/auth";
import PasswordInput from "@/components/ui/PasswordInput";
import Spinner from "@/components/ui/Spinner";

const inputClass =
  "w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500";

export default function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const searchParams = useSearchParams();

  // Keep ?next= when switching between login and register
  const next = searchParams.get("next");
  const registerHref = next
    ? `/register?next=${encodeURIComponent(next)}`
    : "/register";

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError("");

    try {
      const response = await loginUser(values);

      // GuestGuard sees the new session and redirects (to ?next= or /challenges)
      setAuth(response.data.user, response.data.token);
    } catch (error) {
      setServerError(getErrorMessage(error, "Unable to sign in. Please try again."));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Welcome back</h1>

      <p className="mt-2 text-gray-400">
        Log in to continue your system design practice.
      </p>

      {serverError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
            Email
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
            {...register("email")}
          />

          {errors.email && (
            <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">
            Password
          </label>

          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Your password"
            {...register("password")}
          />

          {errors.password && (
            <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Signing in..." : "Log in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-400">
        New to ArchMentor?{" "}
        <Link href={registerHref} className="font-medium text-white underline underline-offset-4 hover:text-blue-400">
          Create an account
        </Link>
      </p>
    </div>
  );
}
