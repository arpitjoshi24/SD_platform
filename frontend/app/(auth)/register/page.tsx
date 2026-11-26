"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerUser } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { getErrorMessage } from "@/lib/errors";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validation/auth";
import PasswordInput from "@/components/ui/PasswordInput";
import Spinner from "@/components/ui/Spinner";
import ErrorBanner from "@/components/ui/ErrorBanner";

const inputClass =
  "w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-4 py-3 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 focus:border-cyan-400";

export default function RegisterPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const searchParams = useSearchParams();

  const next = searchParams.get("next");
  const loginHref = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";

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
      const detectedTimezone =
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : undefined;

      const authData = await registerUser({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        timezone: detectedTimezone,
      });

      setAuth(authData.user, authData.token);
    } catch (error) {
      setServerError(
        getErrorMessage(error, "Unable to create account. Please try again.")
      );
    }
  };

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
        [02 // NEW_OPERATOR_REGISTRATION]
      </p>

      <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight text-white">
        Create Account
      </h1>

      <p className="mt-1.5 text-xs leading-5 text-gray-400">
        Register a standard user account to start building and evaluating system architectures.
      </p>

      {serverError && <ErrorBanner message={serverError} className="mt-5" />}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor="full_name"
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-gray-300"
          >
            Full Name
          </label>

          <input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className={inputClass}
            {...register("full_name")}
          />

          {errors.full_name && (
            <p className="mt-1.5 font-mono text-xs text-rose-400">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-gray-300"
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="engineer@archmentor.dev"
            className={inputClass}
            {...register("email")}
          />

          {errors.email && (
            <p className="mt-1.5 font-mono text-xs text-rose-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-gray-300"
          >
            Password
          </label>

          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register("password")}
          />

          {errors.password && (
            <p className="mt-1.5 font-mono text-xs text-rose-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-gray-300"
          >
            Confirm Password
          </label>

          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            {...register("confirmPassword")}
          />

          {errors.confirmPassword && (
            <p className="mt-1.5 font-mono text-xs text-rose-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-spectrum mt-2 flex w-full items-center justify-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-wider transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Spinner size={15} />}
          <span>{isSubmitting ? "PROVISIONING..." : "CREATE_ACCOUNT →"}</span>
        </button>
      </form>

      <p className="mt-6 border-t border-[#1e222b] pt-5 text-center font-mono text-xs text-gray-400">
        Already registered?{" "}
        <Link
          href={loginHref}
          className="font-semibold text-cyan-400 underline underline-offset-4 hover:text-cyan-300"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}