import type {
  PublicCategory,
} from "@/types/publicCategory";

const resolveMediaUrl = (
  value?: string | null
): string | null => {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  const configuredApiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.vkposme.tech/api/v1";

  const apiOrigin =
    configuredApiUrl
      .replace(
        /\/api\/v1\/?$/,
        ""
      )
      .replace(
        /\/+$/,
        ""
      );

  const normalizedPath =
    value.startsWith("/")
      ? value
      : `/${value}`;

  return `${apiOrigin}${normalizedPath}`;
};

const getAssetUrl = (
  category: PublicCategory
) => {
  const value =
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

  return resolveMediaUrl(
    value
  );
};

export default function CategoryHero({
  category,
}: {
  category: PublicCategory;
}) {
  const imageUrl =
    getAssetUrl(
      category
    );

  return (
    <section className="relative isolate overflow-hidden rounded-[18px] border border-storefront-border-light bg-storefront-surface sm:rounded-[26px]">

      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              imageUrl
            }
            alt={
              category
                .bannerAsset
                ?.altText ||
              category.name
            }
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              object-center
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-black/75
              via-black/35
              to-black/5
              sm:from-black/80
              sm:via-black/45
              sm:to-black/10
            "
          />
        </>
      ) : null}

      <div
        className={[
          `
            relative
            z-10
            flex
            min-h-[150px]
            flex-col
            justify-center
            px-5
            py-6

            sm:min-h-[230px]
            sm:p-8

            md:min-h-[260px]
            md:p-10

            lg:min-h-[290px]
            lg:p-12
          `,

          imageUrl
            ? "text-white"
            : "text-storefront-text",
        ].join(
          " "
        )}
      >
        <p
          className="
            text-[10px]
            font-black
            uppercase
            tracking-[0.18em]
            opacity-80

            sm:text-xs
          "
        >
          Shop by category
        </p>

        <h1
          className="
            mt-2
            max-w-3xl
            text-2xl
            font-black
            tracking-tight

            sm:mt-3
            sm:text-4xl

            lg:text-5xl
          "
        >
          {category.name}
        </h1>

        {category
          .shortDescription ||
        category
          .description ? (
          <p
            className="
              mt-3
              max-w-2xl
              text-xs
              leading-5
              opacity-90

              sm:mt-4
              sm:text-sm
              sm:leading-6

              lg:text-base
            "
          >
            {category
              .shortDescription ||
              category
                .description}
          </p>
        ) : null}
      </div>
    </section>
  );
}