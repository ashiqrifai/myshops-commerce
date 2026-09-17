import type {
    Metadata,
  } from "next";
  
  import {
    ChevronRight,
    ImageIcon,
  } from "lucide-react";
  
  import Link from "next/link";
  
  import {
    getPublicBrands,
  } from "@/lib/storefront/public-brand-api";
  
  import type {
    PublicBrand,
  } from "@/types/publicBrand";
  
  import type {
    StorefrontMediaAsset,
  } from "@/types/storefront";
  
  export const metadata: Metadata = {
    title:
      "Shop by Brand | MyShops UAE",
  
    description:
      "Browse leading electronics and technology brands available at MyShops UAE.",
  };
  
  const BACKEND_URL = (
    process.env
      .NEXT_PUBLIC_BACKEND_URL ||
    process.env
      .NEXT_PUBLIC_API_URL ||
    "http://localhost:5080"
  )
    .replace(
      /\/api\/v1\/?$/,
      ""
    )
    .replace(
      /\/$/,
      ""
    );
  
  const toAbsoluteUrl = (
    value?:
      | string
      | null
  ): string | null => {
    if (
      !value
    ) {
      return null;
    }
  
    const normalized =
      value.trim();
  
    if (
      !normalized
    ) {
      return null;
    }
  
    if (
      normalized.startsWith(
        "http://"
      ) ||
      normalized.startsWith(
        "https://"
      ) ||
      normalized.startsWith(
        "data:"
      )
    ) {
      return normalized;
    }
  
    return `${BACKEND_URL}${
      normalized.startsWith(
        "/"
      )
        ? normalized
        : `/${normalized}`
    }`;
  };
  
  const getBrandAsset = (
    brand:
      PublicBrand
  ): StorefrontMediaAsset | null => {
    return (
      brand.logoAsset ||
      brand.image ||
      brand.bannerAsset ||
      null
    );
  };
  
  const getBrandImageUrl = (
    brand:
      PublicBrand
  ): string | null => {
    const asset =
      getBrandAsset(
        brand
      );
  
    return toAbsoluteUrl(
      asset?.publicUrl ||
        asset?.previewUrl ||
        asset?.thumbnailUrl ||
        null
    );
  };
  
  const getBrandAltText = (
    brand:
      PublicBrand
  ): string => {
    const asset =
      getBrandAsset(
        brand
      );
  
    return (
      asset?.altText ||
      asset?.title ||
      brand.name
    );
  };
  
  function BrandCard({
    brand,
  }: {
    brand:
      PublicBrand;
  }) {
    const imageUrl =
      getBrandImageUrl(
        brand
      );
  
    return (
      <Link
        href={`/brands/${encodeURIComponent(
          brand.slug
        )}`}
        prefetch={
          false
        }
        className={[
          "group",
          "flex",
          "min-w-0",
          "flex-col",
          "overflow-hidden",
          "rounded-xl",
          "border",
          "border-storefront-light",
          "bg-white",
          "transition",
          "duration-200",
          "hover:-translate-y-0.5",
          "hover:border-storefront-primary/30",
          "hover:shadow-md",
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-storefront-primary",
          "focus-visible:ring-offset-2",
        ].join(
          " "
        )}
      >
        <div className="p-4 sm:p-5">
          <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-[#fafafa]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  imageUrl
                }
                alt={getBrandAltText(
                  brand
                )}
                loading="lazy"
                className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.035]"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-storefront-muted">
                <ImageIcon
                  size={
                    30
                  }
                  strokeWidth={
                    1.4
                  }
                />
  
                <span className="text-xs font-medium">
                  No logo
                </span>
              </div>
            )}
          </div>
        </div>
  
        <div className="flex min-h-[60px] items-center justify-between gap-3 px-4 pb-4">
          <h2 className="line-clamp-1 text-sm font-medium text-storefront-text transition group-hover:text-storefront-primary">
            {
              brand.name
            }
          </h2>
  
          <ChevronRight
            size={
              16
            }
            className="shrink-0 text-storefront-muted transition group-hover:translate-x-0.5 group-hover:text-storefront-primary"
          />
        </div>
      </Link>
    );
  }
  
  export default async function BrandsPage() {
    const data =
      await getPublicBrands({
        channel:
          "WEBSITE",
      });
  
    const brands =
      Array.isArray(
        data.brands
      )
        ? data.brands.filter(
            (
              brand
            ) =>
              Boolean(
                brand?.id &&
                  brand?.name &&
                  brand?.slug
              )
          )
        : [];
  
    return (
      <main className="min-h-screen bg-white">
        <div className="border-b border-storefront-light">
          <div className="mx-auto flex w-full max-w-[1440px] items-center gap-2 px-4 py-3 text-xs text-storefront-muted sm:px-6 lg:px-8">
            <Link
              href="/"
              className="transition hover:text-storefront-primary"
            >
              Home
            </Link>
  
            <ChevronRight
              size={
                14
              }
            />
  
            <span className="font-medium text-storefront-text">
              Brands
            </span>
          </div>
        </div>
  
        <section className="border-b border-storefront-light bg-[#fafafa]">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-storefront-text sm:text-3xl">
              Shop by Brand
            </h1>
  
            <p className="mt-2 max-w-2xl text-sm leading-6 text-storefront-muted sm:text-base">
              Explore products from your favourite technology and electronics brands.
            </p>
          </div>
        </section>
  
        <section className="py-6 sm:py-8 lg:py-10">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            {brands.length >
            0 ? (
              <>
                <p className="mb-5 text-sm text-storefront-muted">
                  <span className="font-medium text-storefront-text">
                    {
                      brands.length
                    }
                  </span>{" "}
                  {brands.length ===
                  1
                    ? "brand"
                    : "brands"}
                </p>
  
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {brands.map(
                    (
                      brand
                    ) => (
                      <BrandCard
                        key={
                          brand.id
                        }
                        brand={
                          brand
                        }
                      />
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-storefront-light bg-[#fafafa] px-6 py-16 text-center">
                <ImageIcon
                  size={
                    36
                  }
                  className="mx-auto text-storefront-muted"
                />
  
                <h2 className="mt-4 text-lg font-medium text-storefront-text">
                  No brands available
                </h2>
  
                <p className="mt-2 text-sm text-storefront-muted">
                  Please check back shortly.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }