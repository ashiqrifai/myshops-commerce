import type {
    Metadata,
  } from "next";
  
  import CustomerAuthGuard from "@/components/account/CustomerAuthGuard";
  
  import CustomerOrdersPageContent from "@/components/account/orders/CustomerOrdersPageContent";
  
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
      "My Orders",
  
    description:
      "View your MyShops orders and delivery status.",
  };
  
  export default async function CustomerOrdersPage() {
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
          <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
            <CustomerAuthGuard>
              <CustomerOrdersPageContent />
            </CustomerAuthGuard>
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