import type {
  Metadata,
} from "next";

import {
  Suspense,
} from "react";

import TamaraFailureClient from "./TamaraFailureClient";

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
  title:
    "Tamara Payment Failed | MyShops",
};

type PageProps = {
  searchParams:
    Promise<{
      myshopsOrderId?:
        string |
        string[];

      orderId?:
        string |
        string[];
    }>;
};

export default async function TamaraFailurePage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  const rawOrderId =
    params.myshopsOrderId;

  const myshopsOrderId =
    Array.isArray(
      rawOrderId
    )
      ? rawOrderId[0] ||
        null
      : rawOrderId ||
        null;

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
        <div className="mx-auto flex min-h-[520px] w-full max-w-[1440px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="py-24 text-center">
                Checking your Tamara payment…
              </div>
            }
          >
            <TamaraFailureClient
              orderId={
                myshopsOrderId
              }
            />
          </Suspense>
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