"use client";

import {
  Eye,
  EyeOff,
  LoaderCircle,
  UserPlus,
} from "lucide-react";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
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
  registerCustomer,
} from "@/lib/customer-auth/customerAuthApi";

export default function CustomerRegisterForm() {
  const router =
    useRouter();

  const dispatch =
    useAppDispatch();

  const [
    firstName,
    setFirstName,
  ] =
    useState(
      ""
    );

  const [
    lastName,
    setLastName,
  ] =
    useState(
      ""
    );

  const [
    email,
    setEmail,
  ] =
    useState(
      ""
    );

  const [
    mobile,
    setMobile,
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
    confirmPassword,
    setConfirmPassword,
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
    marketingConsent,
    setMarketingConsent,
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

      setErrorMessage(
        null
      );

      if (
        password !==
        confirmPassword
      ) {
        setErrorMessage(
          "Passwords do not match."
        );

        return;
      }

      setSubmitting(
        true
      );

      dispatch(
        setCustomerAuthError(
          null
        )
      );

      try {
        const result =
          await registerCustomer({
            firstName:
              firstName.trim(),

            lastName:
              lastName.trim() ||
              undefined,

            email:
              email.trim(),

            mobile:
              mobile.trim() ||
              undefined,

            password,

            preferredLanguage:
              "en",

            marketingConsent,
          });

        dispatch(
          setCustomerAuth({
            customer:
              result.customer,

            accessToken:
              result.accessToken,
          })
        );

        router.replace(
          "/account"
        );

        router.refresh();
      } catch (
        error
      ) {
        const message =
          error instanceof
            CustomerAuthApiError
            ? error.message
            : "Unable to create your account. Please try again.";

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="customer-first-name"
            className="mb-2 block text-sm font-black text-storefront-text"
          >
            First name
          </label>

          <input
            id="customer-first-name"
            required
            autoComplete="given-name"
            value={
              firstName
            }
            onChange={(
              event
            ) =>
              setFirstName(
                event.target
                  .value
              )
            }
            className="h-12 w-full rounded-xl border border-storefront bg-white px-4 text-sm outline-none focus:border-storefront-primary"
          />
        </div>

        <div>
          <label
            htmlFor="customer-last-name"
            className="mb-2 block text-sm font-black text-storefront-text"
          >
            Last name
          </label>

          <input
            id="customer-last-name"
            autoComplete="family-name"
            value={
              lastName
            }
            onChange={(
              event
            ) =>
              setLastName(
                event.target
                  .value
              )
            }
            className="h-12 w-full rounded-xl border border-storefront bg-white px-4 text-sm outline-none focus:border-storefront-primary"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="customer-register-email"
          className="mb-2 block text-sm font-black text-storefront-text"
        >
          Email address
        </label>

        <input
          id="customer-register-email"
          type="email"
          required
          autoComplete="email"
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
          className="h-12 w-full rounded-xl border border-storefront bg-white px-4 text-sm outline-none focus:border-storefront-primary"
        />
      </div>

      <div>
        <label
          htmlFor="customer-mobile"
          className="mb-2 block text-sm font-black text-storefront-text"
        >
          Mobile number
        </label>

        <input
          id="customer-mobile"
          type="tel"
          autoComplete="tel"
          value={
            mobile
          }
          onChange={(
            event
          ) =>
            setMobile(
              event.target
                .value
            )
          }
          className="h-12 w-full rounded-xl border border-storefront bg-white px-4 text-sm outline-none focus:border-storefront-primary"
          placeholder="+971 50 000 0000"
        />
      </div>

      <div>
        <label
          htmlFor="customer-register-password"
          className="mb-2 block text-sm font-black text-storefront-text"
        >
          Password
        </label>

        <div className="relative">
          <input
            id="customer-register-password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            required
            minLength={
              8
            }
            autoComplete="new-password"
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
            className="h-12 w-full rounded-xl border border-storefront bg-white px-4 pr-12 text-sm outline-none focus:border-storefront-primary"
            placeholder="At least 8 characters"
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
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-storefront-muted hover:bg-storefront-secondary"
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
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

        <p className="mt-2 text-xs leading-5 text-storefront-muted">
          Use at least one uppercase letter, one lowercase letter and one number.
        </p>
      </div>

      <div>
        <label
          htmlFor="customer-confirm-password"
          className="mb-2 block text-sm font-black text-storefront-text"
        >
          Confirm password
        </label>

        <input
          id="customer-confirm-password"
          type={
            showPassword
              ? "text"
              : "password"
          }
          required
          minLength={
            8
          }
          autoComplete="new-password"
          value={
            confirmPassword
          }
          onChange={(
            event
          ) =>
            setConfirmPassword(
              event.target
                .value
            )
          }
          className="h-12 w-full rounded-xl border border-storefront bg-white px-4 text-sm outline-none focus:border-storefront-primary"
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-storefront-secondary p-4">
        <input
          type="checkbox"
          checked={
            marketingConsent
          }
          onChange={(
            event
          ) =>
            setMarketingConsent(
              event.target
                .checked
            )
          }
          className="mt-1"
        />

        <span className="text-sm leading-6 text-storefront-muted">
          Send me product updates, launches and special offers.
        </span>
      </label>

      <button
        type="submit"
        disabled={
          submitting
        }
        className="flex h-12 w-full items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? (
          <LoaderCircle
            size={
              18
            }
            className="animate-spin"
          />
        ) : (
          <UserPlus
            size={
              18
            }
          />
        )}

        {submitting
          ? "Creating account..."
          : "Create account"}
      </button>

      <p className="text-center text-sm text-storefront-muted">
        Already registered?{" "}

        <Link
          href="/account/login"
          className="font-black text-storefront-primary"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
