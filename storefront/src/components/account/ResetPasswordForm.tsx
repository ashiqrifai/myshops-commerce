"use client";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  CustomerAuthApiError,
  resetCustomerPassword,
} from "@/lib/customer-auth/customerAuthApi";

export default function ResetPasswordForm() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const token =
    searchParams.get(
      "token"
    ) ||
    "";

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string |
      null
    >(null);

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<
      string |
      null
    >(null);

  const submit =
    async (
      event:
        FormEvent<
          HTMLFormElement
        >
    ) => {
      event.preventDefault();

      setErrorMessage(null);
      setSuccessMessage(null);

      if (!token) {
        setErrorMessage(
          "This password reset link is missing its security token. Please request a new reset link."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setErrorMessage(
          "Password confirmation does not match."
        );

        return;
      }

      setSubmitting(true);

      try {
        const result =
          await resetCustomerPassword({
            token,
            password,
            confirmPassword,
          });

        setSuccessMessage(
          result.message
        );

        window.setTimeout(
          () => {
            router.replace(
              "/account/login?passwordReset=1"
            );
          },
          1500
        );
      } catch (error) {
        setErrorMessage(
          error instanceof
            CustomerAuthApiError
            ? error.message
            : "Unable to reset your password. Please request a new reset link."
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (!token) {
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold leading-6 text-red-700">
          This reset link is incomplete or invalid.
        </div>

        <Link
          href="/account/forgot-password"
          className="inline-flex h-12 items-center justify-center rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-5"
    >
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
          {
            errorMessage
          }
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold leading-6 text-emerald-800">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0"
          />

          <span>
            {
              successMessage
            }
          </span>
        </div>
      ) : null}

      <div>
        <label
          htmlFor="new-password"
          className="mb-2 block text-sm font-black text-storefront-text"
        >
          New password
        </label>

        <div className="relative">
          <LockKeyhole
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-storefront-muted"
          />

          <input
            id="new-password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={
              password
            }
            onChange={(
              event
            ) =>
              setPassword(
                event.target.value
              )
            }
            className="h-12 w-full rounded-xl border border-storefront bg-white pl-11 pr-12 text-sm outline-none transition focus:border-storefront-primary"
            placeholder="Enter your new password"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (
                  current
                ) =>
                  !current
              )
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-storefront-muted hover:bg-storefront-secondary"
          >
            {showPassword ? (
              <EyeOff
                size={18}
              />
            ) : (
              <Eye
                size={18}
              />
            )}
          </button>
        </div>

        <p className="mt-2 text-xs leading-5 text-storefront-muted">
          Use 8–128 characters with at least one uppercase letter, one lowercase letter and one number.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirm-new-password"
          className="mb-2 block text-sm font-black text-storefront-text"
        >
          Confirm new password
        </label>

        <input
          id="confirm-new-password"
          type={
            showPassword
              ? "text"
              : "password"
          }
          autoComplete="new-password"
          required
          value={
            confirmPassword
          }
          onChange={(
            event
          ) =>
            setConfirmPassword(
              event.target.value
            )
          }
          className="h-12 w-full rounded-xl border border-storefront bg-white px-4 text-sm outline-none transition focus:border-storefront-primary"
          placeholder="Re-enter your new password"
        />
      </div>

      <button
        type="submit"
        disabled={
          submitting ||
          Boolean(
            successMessage
          )
        }
        className="flex h-12 w-full items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
        ) : (
          <LockKeyhole
            size={18}
          />
        )}

        {submitting
          ? "Resetting password..."
          : "Reset password"}
      </button>
    </form>
  );
}
