import type {
  PublicCategory,
} from "@/types/publicCategory";

const getAssetUrl = (
  category: PublicCategory
) =>
  category.bannerAsset
    ?.variants?.find(
      (variant) =>
        variant.variantType ===
        "DESKTOP"
    )?.publicUrl ||
  category.bannerAsset
    ?.variants?.find(
      (variant) =>
        variant.variantType ===
        "LARGE"
    )?.publicUrl ||
  category.bannerAsset
    ?.publicUrl ||
  category.imageAsset
    ?.publicUrl ||
  null;

export default function CategoryHero({
  category,
}: {
  category: PublicCategory;
}) {
  const imageUrl =
    getAssetUrl(category);

  return (
    <section className="relative isolate overflow-hidden rounded-[26px] border border-storefront bg-storefront-surface">
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={
              category.bannerAsset
                ?.altText ||
              category.name
            }
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
        </>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[230px] flex-col justify-center p-7 sm:min-h-[290px] sm:p-10 lg:p-12",
          imageUrl
            ? "text-white"
            : "text-storefront-text",
        ].join(" ")}
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
          Shop by category
        </p>

        <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
          {category.name}
        </h1>

        {category.shortDescription ||
        category.description ? (
          <p className="mt-4 max-w-2xl text-sm leading-6 opacity-90 sm:text-base">
            {category.shortDescription ||
              category.description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
