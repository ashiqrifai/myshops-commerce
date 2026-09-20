"use client";

import {
  BadgeCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  useEffect,
  useMemo,
} from "react";

import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";

import type {
  PublicProductData,
} from "@/types/publicProduct";

import {
  trackStorefrontActivity,
} from "@/lib/storefront/storefront-activity-api";

const renderList = (
  value: unknown[]
) =>
  value
    .map(
      (
        item
      ) => {
        if (
          typeof item ===
          "string"
        ) {
          return item;
        }

        if (
          item &&
          typeof item ===
            "object"
        ) {
          const record =
            item as Record<
              string,
              unknown
            >;

          return String(
            record.label ||
              record.name ||
              record.value ||
              record.text ||
              ""
          );
        }

        return "";
      }
    )
    .filter(
      Boolean
    );

interface BenefitItem {
  icon:
    LucideIcon;

  title:
    string;

  text:
    string;
}

const benefits:
  BenefitItem[] = [
    {
      icon:
        Truck,

      title:
        "Same Day Delivery",

      text:
        "Order before 2PM",
    },

    {
      icon:
        WalletCards,

      title:
        "Secure Payments",

      text:
        "100% Protected",
    },

    {
      icon:
        BadgeCheck,

      title:
        "100% Genuine Products",

      text:
        "Authorized Retailer",
    },

    {
      icon:
        ShieldCheck,

      title:
        "Official Warranty",

      text:
        "Peace of Mind",
    },

    {
      icon:
        RotateCcw,

      title:
        "Easy Returns",

      text:
        "Hassle Free Returns",
    },
  ];

export default function ProductDetailsContent({
  data,
}: {
  data:
    PublicProductData;
}) {
  const {
    product,
  } =
    data;


  /*
  |--------------------------------------------------------------------------
  | Track Product View
  |--------------------------------------------------------------------------
  |
  | Records anonymous/customer product interest.
  | This runs when the customer opens a product detail page
  | or navigates to another product.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      void trackStorefrontActivity({
        activityType:
          "VIEW_PRODUCT",
  
        productId:
          product.id,
  
        variantId:
          product.defaultVariantId ||
          null,
  
        categoryId:
          product.primaryCategory
            ?.id ||
          null,
  
        brandId:
          product.brand
            ?.id ||
          null,
  
        source:
        
          "PRODUCT_PAGE",
      });
    },
    [
      product.id,
      product.defaultVariantId,
      product.primaryCategory
        ?.id,
      product.brand
        ?.id,
    ]
  );
  const features =
    renderList(
      product.features
    );

  const boxItems =
    renderList(
      product.whatsInTheBox
    );

  const heroImage =
    useMemo(
      () =>
        product.gallery[
          0
        ]?.mediaAsset
          ?.publicUrl ||
        null,

      [
        product.gallery,
      ]
    );

  const scrollToSection = (
    sectionId:
      string
  ) => {
    document
      .getElementById(
        sectionId
      )
      ?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start",
      });
  };

  return (
    <div className="mt-10 space-y-10">
      <section className="grid gap-5 bg-storefront-secondary/70 px-6 py-6 sm:grid-cols-2 lg:grid-cols-5">
        {benefits.map(
          (
            benefit
          ) => {
            const Icon =
              benefit.icon;

            return (
              <div
                key={
                  benefit.title
                }
                className="flex items-center gap-3"
              >
                <Icon
                  size={
                    34
                  }
                  className="shrink-0 text-storefront-primary"
                />

                <div>
                  <p className="text-sm font-black text-storefront-text">
                    {
                      benefit.title
                    }
                  </p>

                  <p className="text-xs text-storefront-muted">
                    {
                      benefit.text
                    }
                  </p>
                </div>
              </div>
            );
          }
        )}
      </section>

      

      <section className="overflow-hidden rounded-[22px] border border-[#d9dde3] bg-white">
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-[#d9dde3] px-5 pt-5 sm:px-8 sm:pt-6">
          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "product-description"
              )
            }
            className="border-b-4 border-[#bfc5cc] px-1 pb-4 text-base font-black text-storefront-text transition hover:text-storefront-primary"
          >
            Description
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "product-specifications"
              )
            }
            className="border-b-4 border-transparent px-1 pb-4 text-base font-black text-storefront-text transition hover:border-[#d9dde3] hover:text-storefront-primary"
          >
            Specifications
          </button>
        </div>

        <div
          id="product-description"
          className="scroll-mt-28 px-5 py-6 sm:px-8 sm:py-7"
        >
          <h2 className="text-xl font-black text-storefront-text sm:text-2xl">
            Description
          </h2>

          <div className="mt-4 grid items-center gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">
            <div>
              <div className="max-w-3xl whitespace-pre-line text-sm leading-7 text-storefront-text sm:text-[15px]">
                {product.description ||
                  "Product description is not available."}
              </div>

              {features.length ? (
                <ul className="mt-6 space-y-3">
                  {features.map(
                    (
                      feature
                    ) => (
                      <li
                        key={
                          feature
                        }
                        className="text-sm font-semibold text-storefront-text"
                      >
                        •{" "}
                        {
                          feature
                        }
                      </li>
                    )
                  )}
                </ul>
              ) : null}
            </div>

            {heroImage ? (
              <div className="flex items-center justify-center rounded-2xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    heroImage
                  }
                  alt={
                    product.name
                  }
                  className="max-h-[260px] w-full object-contain"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#d9dde3]" />

        <div
          id="product-specifications"
          className="scroll-mt-28 px-5 py-6 sm:px-8 sm:py-7"
        >
          <h2 className="text-xl font-black text-storefront-text sm:text-2xl">
            Specifications
          </h2>

          {product.specifications.length ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-[#d9dde3]">
              <table className="w-full border-collapse text-left text-sm">
                <tbody>
                  {product.specifications.map(
                    (
                      specification,
                      index
                    ) => (
                      <tr
                        key={
                          specification.id
                        }
                        className={
                          index %
                            2 ===
                          0
                            ? "bg-[#f4f5f6]"
                            : "bg-white"
                        }
                      >
                        <th
                          scope="row"
                          className="w-[35%] border-r border-[#d9dde3] px-4 py-3 font-black text-storefront-text sm:w-[280px] sm:px-5"
                        >
                          {
                            specification
                              .attribute
                              ?.name ||
                            "Specification"
                          }
                        </th>

                        <td className="px-4 py-3 text-storefront-muted sm:px-5">
                          {
                            specification
                              .displayValue ||
                            "-"
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-sm text-storefront-muted">
              Product specifications are not available.
            </p>
          )}
        </div>
      </section>

      {boxItems.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {boxItems.length ? (
            <section className="rounded-[22px] border border-[#d9dde3] bg-white p-6 sm:p-8">
              <h2 className="text-xl font-black">
                What&apos;s in the box
              </h2>

              <ul className="mt-4 space-y-2 text-sm text-storefront-muted">
                {boxItems.map(
                  (
                    item
                  ) => (
                    <li
                      key={
                        item
                      }
                    >
                      •{" "}
                      {
                        item
                      }
                    </li>
                  )
                )}
              </ul>
            </section>
          ) : null}

          
        </div>
      ) : null}

{data.relatedProducts.filter(
  (related) =>
    Boolean(
      related
        .defaultVariant
        ?.id
    ) &&
    related.price
      ?.sellingPrice !=
      null &&
    related.availability
      ?.status !==
      "OUT_OF_STOCK"
).length ? (
  <section id="related-products">
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-3xl font-black">
        You May Also Like
      </h2>

      <button
        type="button"
        className="text-sm font-black"
      >
        View All⌄
      </button>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      {data.relatedProducts
        .filter(
          (related) =>
            Boolean(
              related
                .defaultVariant
                ?.id
            ) &&
            related.price
              ?.sellingPrice !=
              null &&
            related.availability
              ?.status !==
              "OUT_OF_STOCK"
        )
        .slice(
          0,
          5
        )
        .map(
          (
            related
          ) => (
            <StorefrontProductCard
              key={
                related.id
              }
              product={
                related
              }
            />
          )
        )}
    </div>
  </section>
) : null}
    </div>
  );
}