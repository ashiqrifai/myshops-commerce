import Link from "next/link";

import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";

import type {
  FeaturedProductGridContent,
  FeaturedProductGridSettings,
  StorefrontSection,
} from "@/types/storefront";

interface FeaturedProductGridSectionProps {
  section: StorefrontSection;
}

const getColumnClasses = (
  settings:
    FeaturedProductGridSettings
): string => {
  const mobileColumns =
    Number(
      settings.columnsMobile ||
        2
    );

  const tabletColumns =
    Number(
      settings.columnsTablet ||
        3
    );

  const desktopColumns =
    Number(
      settings.columnsDesktop ||
        settings.columns ||
        4
    );

  const mobileClass =
    mobileColumns <= 1
      ? "grid-cols-1"
      : "grid-cols-2";

  const tabletClass =
    tabletColumns <= 2
      ? "sm:grid-cols-2"
      : tabletColumns === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-4";

  const desktopClass =
    desktopColumns <= 2
      ? "lg:grid-cols-2"
      : desktopColumns === 3
        ? "lg:grid-cols-3"
        : desktopColumns === 5
          ? "lg:grid-cols-5"
          : desktopColumns >= 6
            ? "lg:grid-cols-6"
            : "lg:grid-cols-4";

  return [
    mobileClass,
    tabletClass,
    desktopClass,
  ].join(" ");
};

export default function FeaturedProductGridSection({
  section,
}: FeaturedProductGridSectionProps) {
  const content =
    (section.content ||
      {}) as FeaturedProductGridContent;

  const settings =
    (section.settings ||
      {}) as FeaturedProductGridSettings;

  const products =
    Array.isArray(
      content.productIdsResolved
    )
      ? content.productIdsResolved
      : [];

  const maximumProducts =
    Math.max(
      1,
      Number(
        settings.maximumProducts ||
          products.length ||
          12
      )
    );

  const visibleProducts =
    products.slice(
      0,
      maximumProducts
    );

  if (
    visibleProducts.length ===
    0
  ) {
    return null;
  }

  const title =
    content.title ||
    "Featured Products";

  const subtitle =
    content.subtitle ||
    "";

  return (
    <section
      data-section-id={
        section.id
      }
      data-section-code={
        section.code
      }
      data-section-type={
        section.type.code
      }
      className="w-full py-8 sm:py-10 lg:py-12"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-storefront-primary">
              Recommended for you
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-storefront-text sm:text-3xl">
              {title}
            </h2>

            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-storefront-muted sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>

          <Link
            href="/products"
            className="shrink-0 text-sm font-bold text-storefront-primary transition hover:opacity-75"
          >
            View all products
          </Link>
        </div>

        <div
          className={[
            "grid gap-3 sm:gap-4 lg:gap-5",
            getColumnClasses(
              settings
            ),
          ].join(" ")}
        >
          {visibleProducts.map(
            (product) => (
              <StorefrontProductCard
                key={product.id}
                product={product}

                showPrice={
                  settings.showPrice !==
                  false
                }

                showBrand={
                  settings.showBrand !==
                  false
                }

                showWishlist={
                  settings.showWishlist !==
                  false
                }

                showAddToCart={
                  settings.showAddToCart !==
                  false
                }
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}