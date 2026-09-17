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
  
  interface PageProps {
    params:
      Promise<{
        slug:
          string;
      }>;
  }
  
  const buildCmsSlug = (
    slug:
      string
  ) => {
    const cleanSlug =
      String(
        slug ||
          ""
      )
        .trim()
        .replace(
          /^\/+/,
          ""
        )
        .replace(
          /\/+$/,
          ""
        );
  
    return cleanSlug
      ? `/${cleanSlug}`
      : "/";
  };
  
  export async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    try {
      const {
        slug,
      } =
        await params;
  
      const cmsSlug =
        buildCmsSlug(
          slug
        );
  
      const storefront =
        await getStorefrontPage({
          slug:
            cmsSlug,
  
          channel:
            "WEBSITE",
        });
  
      const seo =
        storefront.page
          .seo;
  
      const title =
        seo.title ||
        storefront.page
          .title ||
        storefront.page
          .name ||
        storefront.company
          .name;
  
      const description =
        seo.description ||
        storefront.page
          .description ||
        undefined;
  
      return {
        title,
  
        description,
  
        keywords:
          seo.keywords
            ?.length
            ? seo.keywords
            : undefined,
  
        alternates: {
          canonical:
            cmsSlug,
        },
  
        openGraph: {
          type:
            "website",
  
          title,
  
          description,
  
          siteName:
            storefront.company
              .name,
  
          locale:
            "en_AE",
  
          url:
            cmsSlug,
        },
      };
    } catch {
      return {
        title:
          "MyShops",
  
        description:
          "Shop electronics, technology and accessories from MyShops UAE.",
      };
    }
  }
  
  export default async function CmsPage({
    params,
  }: PageProps) {
    try {
      const {
        slug,
      } =
        await params;
  
      const cmsSlug =
        buildCmsSlug(
          slug
        );
  
      const storefront =
        await getStorefrontPage({
          slug:
            cmsSlug,
  
          channel:
            "WEBSITE",
        });
  
      const globalSections =
        splitGlobalStorefrontSections(
          storefront.page
            .sections
        );
  
      const pageWithoutGlobalSections = {
        ...storefront.page,
  
        sections:
          globalSections
            .pageSections,
      };
  
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
  
          <PageRenderer
            page={
              pageWithoutGlobalSections
            }
          />
  
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
  