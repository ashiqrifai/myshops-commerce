import Link from "next/link";
import { ImageIcon } from "lucide-react";

import type {
  PublicCategory,
} from "@/types/publicCategory";

const getImageUrl = (
  category: PublicCategory
) =>
  category.thumbnailAsset
    ?.variants?.find(
      (variant) =>
        variant.variantType ===
        "SMALL"
    )?.publicUrl ||
  category.thumbnailAsset
    ?.variants?.find(
      (variant) =>
        variant.variantType ===
        "THUMBNAIL"
    )?.publicUrl ||
  category.thumbnailAsset
    ?.publicUrl ||
  category.image?.publicUrl ||
  null;

export default function SubcategoryGrid({
  categories,
}: {
  categories: PublicCategory[];
}) {
  if (!categories.length) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
            Explore more
          </p>

          <h2 className="mt-1 text-2xl font-black text-storefront-text">
            Subcategories
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map(
          (category) => {
            const imageUrl =
              getImageUrl(
                category
              );

            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group overflow-hidden rounded-2xl border border-storefront bg-storefront-surface p-3 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-storefront-secondary">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={
                        category.name
                      }
                      className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <ImageIcon
                      size={28}
                      className="text-storefront-muted"
                    />
                  )}
                </div>

                <p className="mt-3 line-clamp-2 text-center text-sm font-bold text-storefront-text">
                  {category.name}
                </p>
              </Link>
            );
          }
        )}
      </div>
    </section>
  );
}
