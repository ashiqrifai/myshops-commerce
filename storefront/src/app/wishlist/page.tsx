import type { Metadata } from "next";

import WishlistContent from "@/components/storefront/wishlist/WishlistContent";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import { getStorefrontPage } from "@/lib/storefront/storefront-api";
import { splitGlobalStorefrontSections } from "@/lib/storefront/storefront-sections";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Products saved to your MyShops wishlist.",
};

export default async function WishlistPage() {
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

      <main className="flex-1 bg-storefront-background">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-storefront pb-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
              Saved products
            </p>
            <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
              Wishlist
            </h1>
          </div>

          <WishlistContent />
        </div>
      </main>

      <StorefrontFooter storefront={storefront} />
    </StorefrontShell>
  );
}
