"use client";

import {
  Heart,
  History,
  LogOut,
  MapPin,
  Package,
  UserRound,
} from "lucide-react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  clearCustomerAuth,
  selectCustomer,
  selectCustomerAccessToken,
} from "@/store/slices/customerAuthSlice";

import {
  clearCustomerAuthStorage,
} from "@/store/customerAuthStorage";

import {
  logoutCustomer,
  logoutCustomerFromAllDevices,
} from "@/lib/customer-auth/customerAuthApi";

export default function CustomerAccountDashboard() {
  const router =
    useRouter();

  const dispatch =
    useAppDispatch();

  const customer =
    useAppSelector(
      selectCustomer
    );

  const accessToken =
    useAppSelector(
      selectCustomerAccessToken
    );

  const logout =
    async (
      allDevices =
        false
    ) => {
      try {
        if (
          allDevices &&
          accessToken
        ) {
          await logoutCustomerFromAllDevices(
            accessToken
          );
        } else {
          await logoutCustomer();
        }
      } catch {
        // Clear the local session even if the backend logout request fails.
      } finally {
        dispatch(
          clearCustomerAuth()
        );

        clearCustomerAuthStorage();

        router.replace(
          "/"
        );

        router.refresh();
      }
    };

  if (
    !customer
  ) {
    return null;
  }

  const cards = [
    {
      href:
        "/account/orders",

      title:
        "Orders",

      description:
        "Track purchases, invoices and delivery status.",

      icon:
        Package,
    },

    {
      href:
        "/account/addresses",

      title:
        "Addresses",

      description:
        "Manage shipping and billing addresses.",

      icon:
        MapPin,
    },

    {
      href:
        "/wishlist",

      title:
        "Wishlist",

      description:
        "Review products saved for later.",

      icon:
        Heart,
    },

    {
      href:
        "/account/recently-viewed",

      title:
        "Recently viewed",

      description:
        "Return to products you viewed recently.",

      icon:
        History,
    },

    {
      href:
        "/account/profile",

      title:
        "Profile",

      description:
        "Update your customer details and preferences.",

      icon:
        UserRound,
    },
  ];

  return (
    <div>
      <section className="rounded-[22px] border border-storefront bg-storefront-surface p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
          Welcome back
        </p>

        <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
          Hi,{" "}
          {
            customer.firstName
          }
        </h1>

        <p className="mt-2 text-sm text-storefront-muted">
          {
            customer.email
          }
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(
          (
            card
          ) => {
            const Icon =
              card.icon;

            return (
              <Link
                key={
                  card.href
                }
                href={
                  card.href
                }
                className="rounded-[20px] border border-storefront bg-storefront-surface p-5 transition hover:-translate-y-1 hover:border-storefront-primary hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-storefront-secondary text-storefront-primary">
                  <Icon
                    size={
                      21
                    }
                  />
                </div>

                <h2 className="mt-4 text-lg font-black text-storefront-text">
                  {
                    card.title
                  }
                </h2>

                <p className="mt-2 text-sm leading-6 text-storefront-muted">
                  {
                    card.description
                  }
                </p>
              </Link>
            );
          }
        )}
      </section>

      <section className="mt-6 rounded-[22px] border border-storefront bg-storefront-surface p-6">
        <h2 className="text-lg font-black text-storefront-text">
          Account security
        </h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              void logout(
                false
              )
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-storefront-button border border-storefront bg-white px-5 text-sm font-black text-storefront-text"
          >
            <LogOut
              size={
                17
              }
            />

            Sign out
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Sign out from all devices?"
                )
              ) {
                void logout(
                  true
                );
              }
            }}
            className="inline-flex h-11 items-center justify-center rounded-storefront-button border border-red-200 bg-red-50 px-5 text-sm font-black text-red-700"
          >
            Sign out all devices
          </button>
        </div>
      </section>
    </div>
  );
}
