import HeroBannerSection from "@/components/storefront/sections/HeroBannerSection";
import HeroCarouselSection from "@/components/storefront/sections/HeroCarouselSection";
import HeroPromoGridSection from "@/components/storefront/sections/HeroPromoGridSection";
import CategoryGridSection from "@/components/storefront/sections/CategoryGridSection";
import CategoryCarouselSection from "@/components/storefront/sections/CategoryCarouselSection";
import FeaturedProductGridSection from "@/components/storefront/sections/FeaturedProductGridSection";
import BrandCarouselSection from "@/components/storefront/sections/BrandCarouselSection";
import ProductCarouselSection from "@/components/storefront/sections/ProductCarouselSection";
import FlashDealsSection from "@/components/storefront/sections/FlashDealsSection";
import PromotionBannerGridSection from "@/components/storefront/sections/PromotionBannerGridSection";
import PreBookingSection from "@/components/storefront/sections/PreBookingSection";
import CollectionGridSection from "@/components/storefront/sections/CollectionGridSection";
import RichTextSection from "@/components/storefront/sections/RichTextSection";
import TrustBenefitsSection from "@/components/storefront/sections/TrustBenefitsSection";

import type {
  StorefrontSection,
} from "@/types/storefront";

interface SectionRendererProps {
  section: StorefrontSection;
}

export default function SectionRenderer({
  section,
}: SectionRendererProps) {
  const sectionTypeCode =
    section.type.code
      .trim()
      .toUpperCase();

  switch (sectionTypeCode) {
    case "HERO_CAROUSEL":
      return <HeroCarouselSection section={section} />;

    case "HERO_PROMO_GRID":
      return <HeroPromoGridSection section={section} />;

    case "HERO_BANNER":
      return <HeroBannerSection section={section} />;

    case "CATEGORY_GRID":
      return <CategoryGridSection section={section} />;

    case "CATEGORY_CAROUSEL":
      return <CategoryCarouselSection section={section} />;

    case "COLLECTION_GRID":
      return <CollectionGridSection section={section} />;

    case "FEATURED_PRODUCT_GRID":
      return <FeaturedProductGridSection section={section} />;

    case "BRAND_CAROUSEL":
      return <BrandCarouselSection section={section} />;

    case "PRODUCT_CAROUSEL":
      return <ProductCarouselSection section={section} />;

    case "FLASH_DEALS":
      return <FlashDealsSection section={section} />;

    case "PROMOTION_BANNER_GRID":
      return <PromotionBannerGridSection section={section} />;

    case "PRE_BOOKING":
      return <PreBookingSection section={section} />;

    case "TRUST_BENEFITS":
      return <TrustBenefitsSection section={section} />;

    case "RICH_TEXT":
      return (
        <RichTextSection
          section={section}
        />
      );

    default:
      return (
        <section
          data-section-id={section.id}
          data-section-code={section.code}
          data-section-type={section.type.code}
          className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8"
        >
          <div className="rounded-storefront-card border border-dashed border-storefront bg-storefront-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-storefront-primary">
              CMS Section
            </p>

            <h2 className="mt-2 text-lg font-semibold text-storefront-text">
              {section.name}
            </h2>

            <p className="mt-2 text-sm text-storefront-muted">
              Renderer not registered yet for section type{" "}
              <strong>{section.type.code}</strong>.
            </p>
          </div>
        </section>
      );
  }
}
