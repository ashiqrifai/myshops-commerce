"use client";

import Link from "next/link";

import {
  Boxes,
  CalendarClock,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/api\/v1\/?$/, "");

import type {
  Collection,
  CollectionMediaAsset,
} from "@/types/collection";

interface CollectionListProps {
  collections:
    Collection[];

  isChangingStatus:
    boolean;

  isDeleting:
    boolean;

  onStatusChange: (
    collection:
      Collection
  ) => void;

  onDelete: (
    collection:
      Collection
  ) => void;
}

function resolveMediaUrl(
  url?: string | null
): string | null {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

export default function CollectionList({
  collections,
  isChangingStatus,
  isDeleting,
  onStatusChange,
  onDelete,
}: CollectionListProps) {
  if (
    collections.length ===
    0
  ) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f2f3] text-[#6d7175]">
          <Boxes
            size={24}
          />
        </div>

        <h2 className="mt-4 text-base font-semibold text-[#202223]">
          No collections found
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-[#6d7175]">
          Create a collection to
          organize products for
          storefront sections,
          navigation and promotions.
        </p>

        <Link
          href="/admin/collections/new"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
        >
          Add collection
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="bg-[#f6f6f7]">
          <tr className="border-b border-[#e1e3e5]">
            <th className="w-[88px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Image
            </th>

            <th className="min-w-[260px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Collection
            </th>

            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Type
            </th>

            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Products
            </th>

            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Visibility
            </th>

            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Publishing
            </th>

            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Status
            </th>

            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Updated
            </th>

            <th className="w-[170px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {collections.map(
            (
              collection
            ) => {
              const imageUrl =
                getCollectionImageUrl(
                  collection
                    .thumbnailAsset
                );


                console.log(
                  "Collection:",
                  collection.name
                );
            
                console.log(
                  "Thumbnail Asset:",
                  collection.thumbnailAsset
                );
            
                console.log(
                  "Image URL:",
                  imageUrl
                );

              const publishing =
                getPublishingState(
                  collection
                );

              return (
                <tr
                  key={
                    collection.id
                  }
                  className="border-b border-[#f1f2f3] transition hover:bg-[#fafafa] last:border-b-0"
                >
                  <td className="px-4 py-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[#e1e3e5] bg-[#f6f6f7]">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            imageUrl
                          }
                          alt={
                            collection.name
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon
                          size={
                            20
                          }
                          className="text-[#8c9196]"
                        />
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/collections/${collection.id}`}
                        className="text-sm font-semibold text-[#202223] hover:underline"
                      >
                        {
                          collection.name
                        }
                      </Link>

                      {collection.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                          <Star
                            size={
                              11
                            }
                            className="fill-current"
                          />

                          Featured
                        </span>
                      )}
                    </div>

                    <p className="mt-1 font-mono text-xs text-[#6d7175]">
                      /
                      {
                        collection.slug
                      }
                    </p>

                    {collection
                      .shortDescription && (
                      <p className="mt-2 max-w-md line-clamp-2 text-xs leading-5 text-[#6d7175]">
                        {
                          collection.shortDescription
                        }
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <CollectionTypeBadge
                      type={
                        collection.collectionType
                      }
                    />
                  </td>

                  <td className="px-4 py-4 text-right">
                    <p className="text-sm font-semibold tabular-nums text-[#202223]">
                      {Number(
                        collection.productCount ||
                          0
                      ).toLocaleString(
                        "en-US"
                      )}
                    </p>

                    {collection.showProductCount ? (
                      <p className="mt-1 text-[11px] text-green-700">
                        Visible
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-[#8c9196]">
                        Hidden
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex max-w-[210px] flex-wrap gap-1.5">
                      {collection.showOnHome && (
                        <VisibilityBadge label="Homepage" />
                      )}

                      {collection.showInMenu && (
                        <VisibilityBadge label="Menu" />
                      )}

                      {collection.isSearchable && (
                        <VisibilityBadge label="Search" />
                      )}

                      {!collection.showOnHome &&
                        !collection.showInMenu &&
                        !collection.isSearchable && (
                          <span className="text-xs text-[#8c9196]">
                            Not visible
                          </span>
                        )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-start gap-2">
                      <CalendarClock
                        size={
                          15
                        }
                        className={`mt-0.5 shrink-0 ${publishing.iconClassName}`}
                      />

                      <div>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${publishing.badgeClassName}`}
                        >
                          {
                            publishing.label
                          }
                        </span>

                        {publishing.helperText && (
                          <p className="mt-1 max-w-[150px] text-[11px] leading-4 text-[#6d7175]">
                            {
                              publishing.helperText
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                        collection.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-[#e4e5e7] text-[#6d7175]",
                      ].join(
                        " "
                      )}
                    >
                      {collection.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <p className="whitespace-nowrap text-sm text-[#303030]">
                      {formatDate(
                        collection.updatedAt
                      )}
                    </p>

                    <p className="mt-1 whitespace-nowrap text-xs text-[#8c9196]">
                      {formatTime(
                        collection.updatedAt
                      )}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/collections/${collection.id}`}
                        title="Edit collection"
                        aria-label={`Edit ${collection.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#303030] transition hover:bg-[#f6f6f7]"
                      >
                        <Pencil
                          size={
                            15
                          }
                        />
                      </Link>

                      <button
                        type="button"
                        title={
                          collection.isActive
                            ? "Deactivate collection"
                            : "Activate collection"
                        }
                        aria-label={
                          collection.isActive
                            ? `Deactivate ${collection.name}`
                            : `Activate ${collection.name}`
                        }
                        disabled={
                          isChangingStatus ||
                          isDeleting
                        }
                        onClick={() =>
                          onStatusChange(
                            collection
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#303030] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {collection.isActive ? (
                          <EyeOff
                            size={
                              15
                            }
                          />
                        ) : (
                          <Eye
                            size={
                              15
                            }
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        title="Delete collection"
                        aria-label={`Delete ${collection.name}`}
                        disabled={
                          isDeleting ||
                          isChangingStatus
                        }
                        onClick={() =>
                          onDelete(
                            collection
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2
                          size={
                            15
                          }
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}

function CollectionTypeBadge({
  type,
}: {
  type:
    Collection["collectionType"];
}) {
  const isManual =
    type ===
    "MANUAL";

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        isManual
          ? "bg-blue-100 text-blue-800"
          : "bg-purple-100 text-purple-800",
      ].join(
        " "
      )}
    >
      {isManual
        ? "Manual"
        : "Smart"}
    </span>
  );
}

function VisibilityBadge({
  label,
}: {
  label:
    string;
}) {
  return (
    <span className="inline-flex rounded-full bg-[#f1f2f3] px-2 py-0.5 text-[10px] font-semibold text-[#4a4f53]">
      {label}
    </span>
  );
}

function getCollectionImageUrl(
  asset:
    CollectionMediaAsset |
    null |
    undefined
): string | null {
  if (!asset) {
    return null;
  }

  const variants =
    asset.variants || [];

  const primary =
    variants.find(
      (variant) =>
        variant.isPrimary &&
        variant.publicUrl
    );

  if (primary?.publicUrl) {
    return resolveMediaUrl(
      primary.publicUrl
    );
  }

  const thumbnail =
    variants.find(
      (variant) =>
        [
          "THUMBNAIL",
          "SMALL",
          "MEDIUM",
        ].includes(
          String(
            variant.variantType
          ).toUpperCase()
        ) &&
        variant.publicUrl
    );

  if (thumbnail?.publicUrl) {
    return resolveMediaUrl(
      thumbnail.publicUrl
    );
  }

  const firstAvailable =
    variants.find(
      (variant) =>
        Boolean(
          variant.publicUrl
        )
    );

  return resolveMediaUrl(
    firstAvailable?.publicUrl ||
      asset.publicUrl ||
      null
  );
}

interface PublishingPresentation {
  label:
    string;

  helperText:
    string | null;

  badgeClassName:
    string;

  iconClassName:
    string;
}

function getPublishingState(
  collection:
    Collection
): PublishingPresentation {
  if (
    !collection.isActive
  ) {
    return {
      label:
        "Unpublished",

      helperText:
        "Collection is inactive.",

      badgeClassName:
        "bg-[#e4e5e7] text-[#6d7175]",

      iconClassName:
        "text-[#8c9196]",
    };
  }

  const now =
    new Date();

  const publishedFrom =
    parseDate(
      collection.publishedFrom
    );

  const publishedUntil =
    parseDate(
      collection.publishedUntil
    );

  if (
    publishedFrom &&
    publishedFrom.getTime() >
      now.getTime()
  ) {
    return {
      label:
        "Scheduled",

      helperText:
        `Starts ${formatDate(
          publishedFrom.toISOString()
        )}`,

      badgeClassName:
        "bg-blue-100 text-blue-800",

      iconClassName:
        "text-blue-700",
    };
  }

  if (
    publishedUntil &&
    publishedUntil.getTime() <
      now.getTime()
  ) {
    return {
      label:
        "Expired",

      helperText:
        `Ended ${formatDate(
          publishedUntil.toISOString()
        )}`,

      badgeClassName:
        "bg-red-100 text-red-800",

      iconClassName:
        "text-red-700",
    };
  }

  if (
    publishedUntil
  ) {
    return {
      label:
        "Published",

      helperText:
        `Until ${formatDate(
          publishedUntil.toISOString()
        )}`,

      badgeClassName:
        "bg-green-100 text-green-800",

      iconClassName:
        "text-green-700",
    };
  }

  return {
    label:
      "Published",

    helperText:
      publishedFrom
        ? `Since ${formatDate(
            publishedFrom.toISOString()
          )}`
        : "No publishing limit.",

    badgeClassName:
      "bg-green-100 text-green-800",

    iconClassName:
      "text-green-700",
  };
}

function parseDate(
  value:
    string |
    null |
    undefined
): Date | null {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      value
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function formatDate(
  value:
    string
): string {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(
    date
  );
}

function formatTime(
  value:
    string
): string {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    date
  );
}