"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ExternalLink,
  Images,
} from "lucide-react";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface InstagramMediaVariant {
  id:
    string;

  variantType:
    string;

  format?:
    string | null;

  width?:
    number | null;

  height?:
    number | null;

  publicUrl?:
    string | null;
}

interface InstagramMedia {
  id:
    string;

  title?:
    string | null;

  altText?:
    string | null;

  width?:
    number | null;

  height?:
    number | null;

  publicUrl?:
    string | null;

  thumbnailUrl?:
    string | null;

  previewUrl?:
    string | null;

  variants?:
    InstagramMediaVariant[];
}

interface InstagramPost {
  id:
    string;

  instagramUrl:
    string;

  caption?:
    string | null;

  altText?:
    string | null;

  sortOrder:
    number;

  media?:
    InstagramMedia | null;
}

interface InstagramResponse {
  success:
    boolean;

  data?: {
    username:
      string;

    profileUrl:
      string;

    posts:
      InstagramPost[];
  };
}

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "https://api.vkposme.tech/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

/*
|--------------------------------------------------------------------------
| Instagram Section
|--------------------------------------------------------------------------
*/

export default function InstagramSection() {
  const [
    data,
    setData,
  ] =
    useState<
      InstagramResponse["data"] |
      null
    >(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    failed,
    setFailed,
  ] =
    useState(
      false
    );

  /*
  |--------------------------------------------------------------------------
  | Load Instagram Gallery
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      let cancelled =
        false;

      const loadInstagram =
        async () => {
          try {
            setLoading(
              true
            );

            setFailed(
              false
            );

            const url =
              new URL(
                `${API_BASE_URL}/public/storefront/instagram`
              );

            url.searchParams.set(
              "limit",
              "12"
            );

            const response =
              await fetch(
                url.toString(),
                {
                  method:
                    "GET",

                  headers: {
                    Accept:
                      "application/json",

                    "x-company-code":
                      COMPANY_CODE,
                  },

                  cache:
                    "no-store",
                }
              );

            if (
              !response.ok
            ) {
              throw new Error(
                `Instagram request failed with HTTP ${response.status}`
              );
            }

            const payload =
              (
                await response
                  .json()
              ) as
                InstagramResponse;

            if (
              !payload.success ||
              !payload.data
            ) {
              throw new Error(
                "Instagram API returned an invalid response."
              );
            }

            if (
              !cancelled
            ) {
              setData(
                payload.data
              );
            }
          } catch (
            error
          ) {
            console.error(
              "[Instagram Section]",
              error
            );

            if (
              !cancelled
            ) {
              setFailed(
                true
              );

              setData(
                null
              );
            }
          } finally {
            if (
              !cancelled
            ) {
              setLoading(
                false
              );
            }
          }
        };

      void loadInstagram();

      return () => {
        cancelled =
          true;
      };
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (
    loading
  ) {
    return (
      <section className="w-full py-8">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="h-6 w-52 animate-pulse rounded bg-gray-200" />

              <div className="mt-2 h-4 w-36 animate-pulse rounded bg-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-3">
            {Array.from({
              length:
                6,
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="aspect-square animate-pulse rounded-xl bg-gray-100"
                />
              )
            )}
          </div>
        </div>
      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Hide Empty / Failed Gallery
  |--------------------------------------------------------------------------
  */

  if (
    failed ||
    !data ||
    !Array.isArray(
      data.posts
    ) ||
    data.posts.length ===
      0
  ) {
    return null;
  }

  const posts =
    data.posts;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section
      aria-labelledby="instagram-gallery-title"
      className="w-full py-8"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">

        {/* Header */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="instagram-gallery-title"
              className="text-xl font-black tracking-tight text-storefront-text sm:text-[22px]"
            >
              Follow us on Instagram
            </h2>

            <a
              href={
                data.profileUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm font-semibold text-storefront-primary transition hover:opacity-75"
            >
              @
              {
                data.username
              }
            </a>
          </div>

          <a
            href={
              data.profileUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 text-sm font-bold text-storefront-text transition hover:text-storefront-primary sm:inline-flex"
          >
            View Instagram

            <ExternalLink
              size={
                15
              }
            />
          </a>
        </div>

        {/* Gallery */}

        <div
          className={[
            "flex",
            "snap-x",
            "snap-mandatory",
            "gap-2.5",
            "overflow-x-auto",
            "scroll-smooth",
            "pb-1",
            "sm:gap-3",
            "[scrollbar-width:none]",
            "[-ms-overflow-style:none]",
            "[&::-webkit-scrollbar]:hidden",
          ].join(
            " "
          )}
        >
          {posts.map(
            (
              post
            ) => {
              const imageUrl =
                getInstagramImage(
                  post.media
                );

              if (
                !imageUrl
              ) {
                return null;
              }

              return (
                <a
                  key={
                    post.id
                  }
                  href={
                    post.instagramUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={
                    post.altText ||
                    post.caption ||
                    "View Instagram post"
                  }
                  className={[
                    "group",
                    "relative",
                    "block",
                    "shrink-0",
                    "snap-start",
                    "overflow-hidden",
                    "rounded-xl",
                    "bg-[#f6f6f7]",

                    /*
                     * Mobile: about 2.2 tiles
                     */
                    "w-[44%]",

                    /*
                     * Tablet: 3 tiles
                     */
                    "sm:w-[31%]",

                    /*
                     * Desktop: exactly 6 tiles
                     */
                    "lg:w-[calc((100%-2.25rem)/4)]",
                  ].join(
                    " "
                  )}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={
                        imageUrl
                      }
                      alt={
                        post.altText ||
                        post.media
                          ?.altText ||
                        post.caption ||
                        "MyShops Instagram"
                      }
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Hover Overlay */}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/35">
                    <div className="flex h-11 w-11 scale-75 items-center justify-center rounded-full bg-white/95 text-black opacity-0 shadow-lg transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                      <Images
                        size={
                          20
                        }
                      />
                    </div>
                  </div>
                </a>
              );
            }
          )}
        </div>

        {/* Mobile Profile Link */}

        <div className="mt-4 sm:hidden">
          <a
            href={
              data.profileUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-storefront-primary"
          >
            Follow @
            {
              data.username
            }

            <ExternalLink
              size={
                14
              }
            />
          </a>
        </div>
      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Select Best Image
|--------------------------------------------------------------------------
|
| For homepage tiles:
|
| SMALL WebP -> MOBILE WebP -> thumbnail -> preview -> original
|
| We intentionally avoid the 1500px original whenever possible.
|--------------------------------------------------------------------------
*/

function getInstagramImage(
  media:
    InstagramMedia |
    null |
    undefined
): string | null {
  if (
    !media
  ) {
    return null;
  }

  const variants =
    Array.isArray(
      media.variants
    )
      ? media.variants
      : [];

  const findVariant = (
    type:
      string
  ) =>
    variants.find(
      (
        variant
      ) =>
        variant.variantType ===
          type &&
        variant.format ===
          "webp" &&
        Boolean(
          variant.publicUrl
        )
    ) ||
    variants.find(
      (
        variant
      ) =>
        variant.variantType ===
          type &&
        Boolean(
          variant.publicUrl
        )
    );

  return (
    findVariant(
      "SMALL"
    )?.publicUrl ||
    findVariant(
      "MOBILE"
    )?.publicUrl ||
    media.thumbnailUrl ||
    media.previewUrl ||
    media.publicUrl ||
    null
  );
}