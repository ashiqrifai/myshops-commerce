import type {
  Metadata,
} from "next";

import CustomerLoginForm from "@/components/account/CustomerLoginForm";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import {
  getStorefrontPage,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

export const metadata:
  Metadata = {
    title:
      "Sign in",

    description:
      "Sign in to your MyShops customer account.",
  };

export default async function CustomerLoginPage() {
  const storefront =
    await getStorefrontPage({
      slug:
        "/",

      channel:
        "WEBSITE",
    });

  const globalSections =
    splitGlobalStorefrontSections(
      storefront.page
        .sections
    );

  return (
    <StorefrontShell
      storefront={
        storefront
      }
    >
      <StorefrontHeader
        storefront={
          storefront
        }
        announcementSection={
          globalSections
            .announcementSection
        }
        headerSection={
          globalSections
            .headerSection
        }
        navigationSection={
          globalSections
            .navigationSection
        }
      />

      <main className="flex-1 bg-storefront-background">
        <div className="mx-auto grid w-full max-w-[1100px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_480px] lg:px-8 lg:py-16">
          <section className="hidden rounded-[24px] bg-storefront-primary p-10 text-white lg:block">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
              MyShops account
            </p>

            <h1 className="mt-5 text-4xl font-black leading-tight">
              One account for shopping, orders and saved products.
            </h1>

            <div className="mt-10 space-y-5 text-sm leading-7 text-white/85">
              <p>
                Access your wishlist and shopping history from your account.
              </p>

              <p>
                Track orders, delivery status and invoices from one place.
              </p>

              <p>
                Checkout faster with saved details and addresses.
              </p>
            </div>
          </section>

          <section className="rounded-[24px] border border-storefront bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
              Welcome back
            </p>

            <h2 className="mt-2 text-3xl font-black text-storefront-text">
              Sign in
            </h2>

            <p className="mt-2 text-sm text-storefront-muted">
              Enter your email and password to continue.
            </p>

            <div className="mt-8">
              <CustomerLoginForm />
            </div>
          </section>
        </div>
      </main>

      <StorefrontFooter
        storefront={
          storefront
        }
      />
    </StorefrontShell>
  );
}
