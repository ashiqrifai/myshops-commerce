import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ChevronRight,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import PreBookingPurchasePanel from "@/components/storefront/pre-booking/PreBookingPurchasePanel";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import {
  getPublicPreBookingProduct,
} from "@/lib/storefront/public-pre-booking-api";

import {
  getStorefrontPage,
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

interface RouteProps {
  params:
    Promise<{
      campaignSlug: string;
      productSlug: string;
    }>;
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  try {
    const {
      campaignSlug,
      productSlug,
    } =
      await params;

    const data =
      await getPublicPreBookingProduct({
        campaignSlug,
        productSlug,
        channel:
          "WEBSITE",
      });

    const imageUrl =
      data.product.image
        ?.mediaAsset
        ?.publicUrl ||
      data.product.image
        ?.mediaAsset
        ?.previewUrl ||
      undefined;

    return {
      title:
        `Pre-Book ${data.product.name} | MyShops`,

      description:
        data.product
          .shortDescription ||
        `Pre-book ${data.product.name} at MyShops.`,

      openGraph: {
        type:
          "website",

        title:
          `Pre-Book ${data.product.name} | MyShops`,

        description:
          data.product
            .shortDescription ||
          undefined,

        images:
          imageUrl
            ? [
                {
                  url:
                    imageUrl,
                },
              ]
            : undefined,
      },
    };
  } catch {
    return {
      title:
        "Pre-Booking | MyShops",
    };
  }
}

export default async function PreBookingProductPage({
  params,
}: RouteProps) {
  try {
    const {
      campaignSlug,
      productSlug,
    } =
      await params;

    const [
      storefront,
      data,
    ] =
      await Promise.all([
        getStorefrontPage({
          slug:
            "/",

          channel:
            "WEBSITE",
        }),

        getPublicPreBookingProduct({
          campaignSlug,
          productSlug,

          channel:
            "WEBSITE",
        }),
      ]);

    const globalSections =
      splitGlobalStorefrontSections(
        storefront.page
          .sections
      );

    const {
      campaign,
      product,
    } =
      data;

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
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-storefront-muted">
              <Link
                href="/"
                className="hover:text-storefront-primary"
              >
                Home
              </Link>

              <ChevronRight
                size={14}
                className="mx-1"
              />

              <Link
                href={`/pre-booking/${campaign.slug}`}
                className="hover:text-storefront-primary"
              >
                {
                  campaign.name
                }
              </Link>

              <ChevronRight
                size={14}
                className="mx-1"
              />

              <span className="font-bold text-storefront-text">
                {
                  product.name
                }
              </span>
            </nav>

            <PreBookingPurchasePanel
              product={
                product
              }
              campaign={
                campaign
              }
            />
          </div>
        </main>

        <StorefrontFooter
          storefront={
            storefront
          }
        />
      </StorefrontShell>
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        StorefrontApiError &&
      error.status ===
        404
    ) {
      notFound();
    }

    throw error;
  }
}
