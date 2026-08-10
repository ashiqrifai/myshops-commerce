import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import PageRenderer from "@/components/storefront/PageRenderer";
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

export async function generateMetadata(): Promise<Metadata> {
  try {
    const storefront =
      await getStorefrontPage({
        slug: "/",
        channel: "WEBSITE",
      });

    const seo =
      storefront.page.seo;

    return {
      title:
        seo.title ||
        storefront.page.title ||
        storefront.company.name,

      description:
        seo.description ||
        storefront.page.description ||
        undefined,

      keywords:
        seo.keywords?.length
          ? seo.keywords
          : undefined,

      alternates: {
        canonical: "/",
      },

      openGraph: {
        type: "website",

        title:
          seo.title ||
          storefront.company.name,

        description:
          seo.description ||
          storefront.page
            .description ||
          undefined,

        siteName:
          storefront.company.name,

        locale: "en_AE",

        url: "/",
      },
    };
  } catch {
    return {
      title: "MyShops",

      description:
        "Shop electronics, technology and accessories from MyShops UAE.",
    };
  }
}

export default async function Home() {
  try {
    const storefront =
      await getStorefrontPage({
        slug: "/",
        channel: "WEBSITE",
      });

    const globalSections =
      splitGlobalStorefrontSections(
        storefront.page.sections
      );

    const pageWithoutGlobalSections = {
      ...storefront.page,

      sections:
        globalSections.pageSections,
    };

    return (
      <StorefrontShell
        storefront={storefront}
      >
        <StorefrontHeader
          storefront={storefront}
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
    
        <PageRenderer
          page={
            pageWithoutGlobalSections
          }
        />
    
        <StorefrontFooter
          storefront={storefront}
        />
      </StorefrontShell>
    );
  } catch (error) {
    if (
      error instanceof
        StorefrontApiError &&
      error.status === 404
    ) {
      notFound();
    }

    throw error;
  }
}