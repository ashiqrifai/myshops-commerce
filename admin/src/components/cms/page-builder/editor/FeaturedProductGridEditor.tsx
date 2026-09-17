"use client";

import BrandPicker from "@/components/cms/pickers/BrandPicker";
import CategoryPicker from "@/components/cms/pickers/CategoryPicker";
import CollectionPicker from "@/components/cms/pickers/CollectionPicker";
import ProductPicker from "@/components/cms/pickers/ProductPicker";

type ViewAllType =
  | "FEATURED"
  | "CATEGORY"
  | "BRAND"
  | "COLLECTION"
  | "CUSTOM"
  | "NONE";

interface FeaturedProductGridContent {
  title?: string;
  subtitle?: string;

  productIds?: string[];

  categoryId?:
    | string
    | null;

  brandId?:
    | string
    | null;

  showViewAll?: boolean;

  viewAllLabel?: string;

  viewAllType?:
    ViewAllType;

  viewAllTargetId?:
    | string
    | null;

  viewAllUrl?: string;

  viewAllNewTab?: boolean;
}

interface FeaturedProductGridEditorProps {
  value: Record<
    string,
    unknown
  >;

  onChange: (
    value: Record<
      string,
      unknown
    >
  ) => void;
}

export default function FeaturedProductGridEditor({
  value,
  onChange,
}: FeaturedProductGridEditorProps) {
  const content =
    value as FeaturedProductGridContent;

  const productIds =
    Array.isArray(
      content.productIds
    )
      ? content.productIds
      : [];

  const showViewAll =
    content.showViewAll !==
    false;

  const viewAllType:
    ViewAllType =
    content.viewAllType ||
    "FEATURED";

  const viewAllLabel =
    content.viewAllLabel ||
    "View all products";

  const viewAllTargetId =
    content.viewAllTargetId ||
    null;

  const viewAllUrl =
    content.viewAllUrl ||
    "";

  const viewAllNewTab =
    content.viewAllNewTab ===
    true;

  const updateContent = (
    changes:
      Partial<FeaturedProductGridContent>
  ) => {
    onChange({
      ...value,
      ...changes,
    });
  };

  const changeViewAllType = (
    nextType:
      ViewAllType
  ) => {
    updateContent({
      viewAllType:
        nextType,

      viewAllTargetId:
        null,

      viewAllUrl:
        nextType ===
        "CUSTOM"
          ? viewAllUrl
          : "",
    });
  };

  return (
    <div className="space-y-6">
      {/* 
      |--------------------------------------------------------------------------
      | General
      |--------------------------------------------------------------------------
      */}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#202223]">
            Title
          </label>

          <input
            type="text"
            value={
              content.title ||
              ""
            }
            onChange={(
              event
            ) =>
              updateContent({
                title:
                  event.target
                    .value,
              })
            }
            className="h-11 w-full rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#202223] outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
            placeholder="Featured Products"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#202223]">
            Subtitle
          </label>

          <input
            type="text"
            value={
              content.subtitle ||
              ""
            }
            onChange={(
              event
            ) =>
              updateContent({
                subtitle:
                  event.target
                    .value,
              })
            }
            className="h-11 w-full rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#202223] outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
            placeholder="Optional supporting text"
          />
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | Products
      |--------------------------------------------------------------------------
      */}

      <ProductPicker
        selectedIds={
          productIds
        }
        onChange={(
          nextIds
        ) =>
          updateContent({
            productIds:
              nextIds,
          })
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | View All
      |--------------------------------------------------------------------------
      */}

      <div className="rounded-xl border border-[#e1e3e5] bg-white">
        <div className="flex items-start justify-between gap-5 border-b border-[#e1e3e5] p-5">
          <div>
            <h3 className="text-sm font-semibold text-[#202223]">
              View all link
            </h3>

            <p className="mt-1 text-sm leading-5 text-[#6d7175]">
              Choose where customers
              are taken when they
              click View all.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={
              showViewAll
            }
            onClick={() =>
              updateContent({
                showViewAll:
                  !showViewAll,
              })
            }
            className={[
              "relative h-6 w-11 shrink-0 rounded-full transition",
              showViewAll
                ? "bg-[#303030]"
                : "bg-[#c9cccf]",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                showViewAll
                  ? "left-[22px]"
                  : "left-0.5",
              ].join(
                " "
              )}
            />
          </button>
        </div>

        {showViewAll ? (
          <div className="space-y-5 p-5">
            {/* Label */}

            <div>
              <label className="mb-2 block text-sm font-medium text-[#202223]">
                Link label
              </label>

              <input
                type="text"
                value={
                  viewAllLabel
                }
                onChange={(
                  event
                ) =>
                  updateContent({
                    viewAllLabel:
                      event.target
                        .value,
                  })
                }
                className="h-11 w-full rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#202223] outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
                placeholder="View all products"
              />
            </div>

            {/* Destination */}

            <div>
              <label className="mb-2 block text-sm font-medium text-[#202223]">
                Destination
              </label>

              <select
                value={
                  viewAllType
                }
                onChange={(
                  event
                ) =>
                  changeViewAllType(
                    event.target
                      .value as ViewAllType
                  )
                }
                className="h-11 w-full rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#202223] outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
              >
                <option value="FEATURED">
                  Featured products
                </option>

                <option value="CATEGORY">
                  Category
                </option>

                <option value="BRAND">
                  Brand
                </option>

                <option value="COLLECTION">
                  Collection
                </option>

                <option value="CUSTOM">
                  Custom URL
                </option>

                <option value="NONE">
                  No link
                </option>
              </select>
            </div>

            {/*
            |--------------------------------------------------------------------------
            | Category Target
            |--------------------------------------------------------------------------
            */}

            {viewAllType ===
            "CATEGORY" ? (
              <CategoryPicker
                selectedId={
                  viewAllTargetId
                }
                onChange={(
                  categoryId
                ) =>
                  updateContent({
                    viewAllTargetId:
                      categoryId,
                  })
                }
                title="View all category"
                description="Choose the category opened when the customer clicks View all."
              />
            ) : null}

            {/*
            |--------------------------------------------------------------------------
            | Brand Target
            |--------------------------------------------------------------------------
            */}

            {viewAllType ===
            "BRAND" ? (
              <BrandPicker
                selectedId={
                  viewAllTargetId
                }
                onChange={(
                  brandId
                ) =>
                  updateContent({
                    viewAllTargetId:
                      brandId,
                  })
                }
                title="View all brand"
                description="Choose the brand opened when the customer clicks View all."
              />
            ) : null}

            {/*
            |--------------------------------------------------------------------------
            | Collection Target
            |--------------------------------------------------------------------------
            */}

            {viewAllType ===
            "COLLECTION" ? (
              <CollectionPicker
                selectedId={
                  viewAllTargetId
                }
                onChange={(
                  collectionId
                ) =>
                  updateContent({
                    viewAllTargetId:
                      collectionId,
                  })
                }
              />
            ) : null}

            {/*
            |--------------------------------------------------------------------------
            | Featured Message
            |--------------------------------------------------------------------------
            */}

            {viewAllType ===
            "FEATURED" ? (
              <div className="rounded-lg border border-[#e1e3e5] bg-[#f6f6f7] p-4">
                <p className="text-sm font-medium text-[#202223]">
                  Featured Products
                </p>

                <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                  Customers will be
                  sent to
                  {" "}
                  <span className="font-mono">
                    /products/featured
                  </span>
                  .
                </p>
              </div>
            ) : null}

            {/*
            |--------------------------------------------------------------------------
            | Custom URL
            |--------------------------------------------------------------------------
            */}

            {viewAllType ===
            "CUSTOM" ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-[#202223]">
                  Custom URL
                </label>

                <input
                  type="text"
                  value={
                    viewAllUrl
                  }
                  onChange={(
                    event
                  ) =>
                    updateContent({
                      viewAllUrl:
                        event.target
                          .value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-[#babfc3] bg-white px-3 font-mono text-sm text-[#202223] outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
                  placeholder="/offers/summer-sale"
                />

                <p className="mt-1 text-xs text-[#6d7175]">
                  Internal URLs can
                  start with /. Full
                  https:// URLs are
                  also supported.
                </p>
              </div>
            ) : null}

            {/*
            |--------------------------------------------------------------------------
            | Open New Tab
            |--------------------------------------------------------------------------
            */}

            {viewAllType !==
            "NONE" ? (
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    viewAllNewTab
                  }
                  onChange={(
                    event
                  ) =>
                    updateContent({
                      viewAllNewTab:
                        event.target
                          .checked,
                    })
                  }
                  className="h-4 w-4"
                />

                <div>
                  <span className="block text-sm font-medium text-[#202223]">
                    Open in new tab
                  </span>

                  <span className="block text-xs text-[#6d7175]">
                    Normally keep this
                    disabled for pages
                    inside MyShops.
                  </span>
                </div>
              </label>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}