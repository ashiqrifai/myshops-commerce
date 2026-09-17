import type { Metadata } from "next";
import { notFound } from "next/navigation";

import EasyPayPage from "@/components/storefront/easypay/EasyPayPage";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import { getStorefrontPage, StorefrontApiError } from "@/lib/storefront/storefront-api";
import { splitGlobalStorefrontSections } from "@/lib/storefront/storefront-sections";

export const metadata: Metadata = {
  title: "My Shops EasyPay Installments",
  description: "Buy now and pay later with MyShops EasyPay installments, subject to approval and applicable terms.",
  alternates: { canonical: "/my-shops-easypay-installments" },
};

export default async function EasyPayRoute() {
  try {
    const storefront = await getStorefrontPage({ slug: "/", channel: "WEBSITE" });
    const globalSections = splitGlobalStorefrontSections(storefront.page.sections);

    return (
      <StorefrontShell storefront={storefront}>
        <StorefrontHeader
          storefront={storefront}
          announcementSection={globalSections.announcementSection}
          headerSection={globalSections.headerSection}
          navigationSection={globalSections.navigationSection}
        />
        <EasyPayPage />
        <StorefrontFooter storefront={storefront} />
      </StorefrontShell>
    );
  } catch (error) {
    if (error instanceof StorefrontApiError && error.status === 404) notFound();
    throw error;
  }
}
