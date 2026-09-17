import type { Metadata } from "next";
import { notFound } from "next/navigation";

import StoresPage from "@/components/storefront/stores/StoresPage";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import {
  getStorefrontPage,
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

export const metadata: Metadata = {
  title: "Our Stores | MyShops",
  description:
    "Find your nearest MyShops store in the UAE and Azerbaijan. View opening hours and get directions.",
  alternates: {
    canonical: "/stores",
  },
};

export default async function StoresRoute() {
  try {
    const storefront = await getStorefrontPage({
      slug: "/",
      channel: "WEBSITE",
    });

    const globalSections = splitGlobalStorefrontSections(
      storefront.page.sections
    );

    return (
      <StorefrontShell storefront={storefront}>
        <StorefrontHeader
          storefront={storefront}
          announcementSection={globalSections.announcementSection}
          headerSection={globalSections.headerSection}
          navigationSection={globalSections.navigationSection}
        />

        <StoresPage />

        <StorefrontFooter storefront={storefront} />
      </StorefrontShell>
    );
  } catch (error) {
    if (
      error instanceof StorefrontApiError &&
      error.status === 404
    ) {
      notFound();
    }

    throw error;
  }
}
