"use client";

import {
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
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
  useAppDispatch,
} from "@/store/hooks";

import {
  setCustomerAuth,
  setCustomerAuthError,
} from "@/store/slices/customerAuthSlice";

import {
  CustomerAuthApiError,
  loginCustomer,
} from "@/lib/customer-auth/customerAuthApi";

export default function CustomerLoginForm() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const dispatch =
    useAppDispatch();

  const [
    email,
    setEmail,
  ] =
    useState(
      ""
    );

  const [
    password,
    setPassword,
  ] =
    useState(
      ""
    );

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(
      false
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const submit =
    async (
      event:
        FormEvent<
          HTMLFormElement
        >
    ) => {
      event.preventDefault();

      setSubmitting(
        true
      );

      setErrorMessage(
        null
      );

      dispatch(
        setCustomerAuthError(
          null
        )
      );

      try {
        const result =
          await loginCustomer({
            email:
              email.trim(),

            password,
          });

        dispatch(
          setCustomerAuth({
            customer:
              result.customer,

            accessToken:
              result.accessToken,
          })
        );

        const returnUrl =
          searchParams.get(
            "returnUrl"
          );

        router.replace(
          returnUrl &&
          returnUrl.startsWith(
            "/"
          )
            ? returnUrl
            : "/account"
        );

        router.refresh();
      } catch (
        error
      ) {
        const message =
          error instanceof
            CustomerAuthApiError
            ? error.message
            : "Unable to sign in. Please try again.";

        setErrorMessage(
          message
        );

        dispatch(
          setCustomerAuthError(
            message
          )
        );
      } finally {
        setSubmitting(
          false
        );
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

      <div>
        <label
          htmlFor="customer-email"
          className="mb-2 block text-sm font-black text-storefront-text"
        >
          Email address
        </label>

        <input
          id="customer-email"
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
              event.target
                .value
            )
          }
          className="h-12 w-full rounded-xl border border-storefront bg-white px-4 text-sm outline-none transition focus:border-storefront-primary"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="customer-password"
            className="text-sm font-black text-storefront-text"
          >
            Password
          </label>

          <Link
            href="/account/forgot-password"
            className="text-xs font-black text-storefront-primary"
          >
            Forgot password?
          </Link>
        </div>

        <div className="relative">
          <input
            id="customer-password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            autoComplete="current-password"
            required
            value={
              password
            }
            onChange={(
              event
            ) =>
              setPassword(
                event.target
                  .value
              )
            }
            className="h-12 w-full rounded-xl border border-storefront bg-white px-4 pr-12 text-sm outline-none transition focus:border-storefront-primary"
            placeholder="Enter your password"
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
                size={
                  18
                }
              />
            ) : (
              <Eye
                size={
                  18
                }
              />
            )}
          </button>
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
            size={
              18
            }
            className="animate-spin"
          />
        ) : (
          <LogIn
            size={
              18
            }
          />
        )}

        {submitting
          ? "Signing in..."
          : "Sign in"}
      </button>

      <div className="relative py-2 text-center">
        <div className="absolute inset-x-0 top-1/2 border-t border-storefront" />

        <span className="relative bg-white px-3 text-xs font-bold uppercase tracking-wide text-storefront-muted">
          New to MyShops?
        </span>
      </div>

      <Link
        href="/account/register"
        className="flex h-12 w-full items-center justify-center rounded-storefront-button border border-storefront bg-white px-5 text-sm font-black text-storefront-text transition hover:border-storefront-primary hover:text-storefront-primary"
      >
        Create an account
      </Link>

      <Link
        href="/"
        className="block text-center text-sm font-bold text-storefront-muted hover:text-storefront-primary"
      >
        Continue shopping as guest
      </Link>
    </form>
  );
}
