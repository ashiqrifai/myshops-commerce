"use client";

import {
  useEffect,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useAppSelector,
} from "@/store/hooks";

import {
  selectCustomerAuthenticated,
  selectCustomerAuthHydrated,
  selectCustomerAuthInitializing,
} from "@/store/slices/customerAuthSlice";

export default function CustomerAuthGuard({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const hydrated =
    useAppSelector(
      selectCustomerAuthHydrated
    );

  const initializing =
    useAppSelector(
      selectCustomerAuthInitializing
    );

  const authenticated =
    useAppSelector(
      selectCustomerAuthenticated
    );

  useEffect(
    () => {
      if (
        hydrated &&
        !initializing &&
        !authenticated
      ) {
        router.replace(
          `/account/login?returnUrl=${encodeURIComponent(
            pathname ||
            "/account"
          )}`
        );
      }
    },
    [
      authenticated,
      hydrated,
      initializing,
      pathname,
      router,
    ]
  );

  if (
    !hydrated ||
    initializing
  ) {
    return (
      <div className="rounded-[22px] border border-storefront bg-storefront-surface px-6 py-20 text-center text-sm text-storefront-muted">
        Checking your account...
      </div>
    );
  }

  if (
    !authenticated
  ) {
    return null;
  }

  return (
    <>
      {
        children
      }
    </>
  );
}
