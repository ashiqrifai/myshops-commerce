import type {
  Metadata,
} from "next";

import CheckoutPageClient from "@/components/storefront/checkout/CheckoutPageClient";

import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import {
  getStorefrontPage,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

export const metadata: Metadata = {
  title: "Checkout",

  description:
    "Complete your MyShops order securely.",
};

export default async function CheckoutPage() {
  const storefront =
    await getStorefrontPage({
      slug: "/",
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
      storefront={storefront}
    >
      <StorefrontHeader
        storefront={
          storefront
        }
        announcementSection={
          globalSections.announcementSection
        }
        headerSection={
          globalSections.headerSection
        }
        navigationSection={
          globalSections.navigationSection
        }
      />

      <main className="flex-1 bg-storefront-background">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <CheckoutPageClient />
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