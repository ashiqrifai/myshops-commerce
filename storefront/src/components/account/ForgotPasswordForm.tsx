"use client";

import {
  ArrowLeft,
  LoaderCircle,
  Mail,
} from "lucide-react";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

import {
  CustomerAuthApiError,
  forgotCustomerPassword,
} from "@/lib/customer-auth/customerAuthApi";

export default function ForgotPasswordForm() {
  const [
    email,
    setEmail,
  ] =
    useState("");

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

      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const result =
          await forgotCustomerPassword({
            email:
              email.trim(),
          });

        setSuccessMessage(
          result.message
        );
      } catch (error) {
        setErrorMessage(
          error instanceof
            CustomerAuthApiError
            ? error.message
            : "Unable to request a password reset. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-5"
    >
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {
            errorMessage
          }
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold leading-6 text-emerald-800">
          {
            successMessage
          }
        </div>
      ) : null}

      <div>
        <label
          htmlFor="forgot-password-email"
          className="mb-2 block text-sm font-black text-storefront-text"
        >
          Email address
        </label>

        <div className="relative">
          <Mail
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-storefront-muted"
          />

          <input
            id="forgot-password-email"
            type="email"
            autoComplete="email"
            required
            value={
              email
            }
            onChange={(
              event
            ) =>
              setEmail(
                event.target.value
              )
            }
            className="h-12 w-full rounded-xl border border-storefront bg-white pl-11 pr-4 text-sm outline-none transition focus:border-storefront-primary"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={
          submitting
        }
        className="flex h-12 w-full items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
        ) : (
          <Mail
            size={18}
          />
        )}

        {submitting
          ? "Sending reset link..."
          : "Send reset link"}
      </button>

      <Link
        href="/account/login"
        className="flex items-center justify-center gap-2 text-sm font-bold text-storefront-muted transition hover:text-storefront-primary"
      >
        <ArrowLeft
          size={16}
        />

        Back to sign in
      </Link>
    </form>
  );
}
