"use client";

import Link from "next/link";

import {
  StorefrontSection,
  StorefrontBrand,
} from "@/types/storefront";

interface Props {
  section: StorefrontSection;
}

export default function BrandCarouselSection({
  section,
}: Props) {
  const content = section.content as any;
  const settings = section.settings as any;

  const brands: StorefrontBrand[] =
    content?.brandIdsResolved ?? [];

  if (!brands.length) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-6">

        {content.title && (
          <h2 className="mb-8 text-3xl font-bold">
            {content.title}
          </h2>
        )}

        <div
          className="
          grid
          grid-cols-3
          md:grid-cols-5
          lg:grid-cols-8
          gap-6
        "
        >
          {brands.map((brand) => {

            const image =
              brand.logoAsset?.publicUrl ||
              brand.logoAsset?.previewUrl ||
              brand.logoAsset?.thumbnailUrl ||
              brand.image?.publicUrl ||
              brand.image?.previewUrl ||
              brand.image?.thumbnailUrl;

            return (
              <Link
                key={brand.id}
                href={brand.brandUrl}
                className="
                  border
                  rounded-xl
                  bg-white
                  hover:shadow-lg
                  transition
                  p-6
                  flex
                  flex-col
                  items-center
                "
              >
                {image && (
                  <img
                    src={image}
                    alt={brand.name}
                    className="h-16 object-contain"
                  />
                )}

                {settings?.showNames && (
                  <span className="mt-4 text-sm font-medium">
                    {brand.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}