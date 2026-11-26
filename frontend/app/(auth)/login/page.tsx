"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginUser } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { getErrorMessage } from "@/lib/errors";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";
import PasswordInput from "@/components/ui/PasswordInput";
import Spinner from "@/components/ui/Spinner";
import ErrorBanner from "@/components/ui/ErrorBanner";

const inputClass =
  "w-full rounded-[2px] border border-[#1e222b] bg-[#090a0d] px-4 py-3 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 focus:border-cyan-400";

export default function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const authNotice = useAuthStore((s) => s.authNotice);
  const searchParams = useSearchParams();

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
      const authData = await loginUser(values);

      if (authData.user.account_status && authData.user.account_status !== "active") {
        setServerError(
          authData.user.account_status === "suspended"
            ? "Your account has been suspended. Contact an administrator."
            : "Your account is not active."
        );
        return;
      }

      // GuestGuard redirects based on role (/admin/dashboard vs /challenges or ?next=)
      setAuth(authData.user, authData.token);
    } catch (error) {
      setServerError(
        getErrorMessage(error, "Unable to sign in. Please check your credentials.")
      );
    }
  };

  const displayedError = serverError || authNotice || "";

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
        [01 // SESSION_AUTHENTICATION]
      </p>

      <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight text-white">
        Sign In
      </h1>

      <p className="mt-1.5 text-xs leading-5 text-gray-400">
        Authenticate to access system design challenges, sandboxes, and saved attempts.
      </p>

      {displayedError && <ErrorBanner message={displayedError} className="mt-5" />}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 space-y-4"
      >
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
            autoComplete="current-password"
            placeholder="Enter your password"
            {...register("password")}
          />

          {errors.password && (
            <p className="mt-1.5 font-mono text-xs text-rose-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-spectrum mt-2 flex w-full items-center justify-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-wider transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Spinner size={15} />}
          <span>{isSubmitting ? "AUTHENTICATING..." : "SIGN_IN →"}</span>
        </button>
      </form>

      <p className="mt-6 border-t border-[#1e222b] pt-5 text-center font-mono text-xs text-gray-400">
        Need an account?{" "}
        <Link
          href={registerHref}
          className="font-semibold text-cyan-400 underline underline-offset-4 hover:text-cyan-300"
        >
          Create User Account
        </Link>
      </p>
    </div>
  );
}