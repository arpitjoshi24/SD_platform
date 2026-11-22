"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginUser, registerUser } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { getErrorMessage } from "@/lib/errors";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validation/auth";
import PasswordInput from "@/components/ui/PasswordInput";
import Spinner from "@/components/ui/Spinner";

const inputClass =
  "w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const next = searchParams.get("next");
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError("");

    try {
      await registerUser({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      });
    } catch (error) {
      setServerError(getErrorMessage(error, "Registration failed. Please try again."));
      return;
    }

    // Account created -> sign the user straight in.
    try {
      const response = await loginUser({
        email: values.email,
        password: values.password,
      });

      setAuth(response.data.user, response.data.token); // GuestGuard redirects
    } catch {
      router.replace(loginHref); // account exists, just ask them to log in
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Create your account</h1>

      <p className="mt-2 text-gray-400">
        Start designing real systems in minutes.
      </p>

      {serverError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400"
        >
          {serverError}{" "}
          {serverError.toLowerCase().includes("already exists") && (
            <Link href={loginHref} className="font-medium underline">
              Log in instead
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-gray-300">
            Full name
          </label>

          <input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className={inputClass}
            {...register("full_name")}
          />

          {errors.full_name && (
            <p className="mt-1.5 text-sm text-red-400">{errors.full_name.message}</p>
          )}
        </div>

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register("password")}
          />

          {errors.password && (
            <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-300">
            Confirm password
          </label>

          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your password"
            {...register("confirmPassword")}
          />

          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-white underline underline-offset-4 hover:text-blue-400">
          Log in
        </Link>
      </p>
    </div>
  );
}
