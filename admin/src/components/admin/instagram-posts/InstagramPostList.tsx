"use client";

import Link from "next/link";

import {
  ExternalLink,
  ImageIcon,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";

import type {
  InstagramPost,
} from "@/types/instagramPost";

interface InstagramPostListProps {
  posts:
    InstagramPost[];

  isChangingStatus:
    boolean;

  isDeleting:
    boolean;

  onStatusChange:
    (
      post:
        InstagramPost
    ) => void;

  onDelete:
    (
      post:
        InstagramPost
    ) => void;
}

export default function InstagramPostList({
  posts,
  isChangingStatus,
  isDeleting,
  onStatusChange,
  onDelete,
}: InstagramPostListProps) {
  if (
    posts.length ===
    0
  ) {
    return (
      <div className="flex min-h-[360px] items-center justify-center p-6 text-center">
        <div>
          <ImageIcon
            size={
              34
            }
            className="mx-auto text-[#8c9196]"
          />

          <h2 className="mt-4 text-base font-semibold">
            No Instagram posts
          </h2>

          <p className="mt-2 text-sm text-[#6d7175]">
            Add images and connect them to your Instagram posts or reels.
          </p>

          <Link
            href="/admin/instagram-posts/new"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
          >
            Add Instagram post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#e1e3e5] bg-[#fafbfb] text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
            <th className="px-4 py-3">
              Image
            </th>

            <th className="px-4 py-3">
              Caption
            </th>

            <th className="px-4 py-3">
              Instagram
            </th>

            <th className="px-4 py-3 text-center">
              Order
            </th>

            <th className="px-4 py-3 text-center">
              Status
            </th>

            <th className="px-4 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {posts.map(
            (
              post
            ) => {
              const imageUrl =
                getMediaUrl(
                  post
                    .mediaAsset
                );

              return (
                <tr
                  key={
                    post.id
                  }
                  className="border-b border-[#e1e3e5] last:border-b-0 hover:bg-[#fafbfb]"
                >
                  <td className="px-4 py-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-[#e1e3e5] bg-[#f6f6f7]">
                      {imageUrl ? (
                        <img
                          src={
                            imageUrl
                          }
                          alt={
                            post.altText ||
                            post
                              .mediaAsset
                              ?.altText ||
                            "Instagram"
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon
                          size={
                            24
                          }
                          className="text-[#8c9196]"
                        />
                      )}
                    </div>
                  </td>

                  <td className="max-w-[340px] px-4 py-4">
                    <p className="line-clamp-2 text-sm font-medium text-[#202223]">
                      {post.caption ||
                        "No caption"}
                    </p>

                    {post.altText ? (
                      <p className="mt-1 line-clamp-1 text-xs text-[#6d7175]">
                        {
                          post.altText
                        }
                      </p>
                    ) : null}
                  </td>

                  <td className="px-4 py-4">
                    <a
                      href={
                        post.instagramUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#005bd3] hover:underline"
                    >
                      View post

                      <ExternalLink
                        size={
                          14
                        }
                      />
                    </a>
                  </td>

                  <td className="px-4 py-4 text-center text-sm font-medium">
                    {
                      post.sortOrder
                    }
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",

                        post.isActive
                          ? "bg-[#e3f1df] text-[#246b1f]"
                          : "bg-[#f1f2f3] text-[#6d7175]",
                      ].join(
                        " "
                      )}
                    >
                      {post.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/instagram-posts/${post.id}`}
                        title="Edit"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5c5f62] hover:bg-[#f1f2f3] hover:text-[#202223]"
                      >
                        <Pencil
                          size={
                            16
                          }
                        />
                      </Link>

                      <button
                        type="button"
                        title={
                          post.isActive
                            ? "Deactivate"
                            : "Activate"
                        }
                        disabled={
                          isChangingStatus
                        }
                        onClick={() =>
                          onStatusChange(
                            post
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5c5f62] hover:bg-[#f1f2f3] hover:text-[#202223] disabled:opacity-50"
                      >
                        <Power
                          size={
                            16
                          }
                        />
                      </button>

                      <button
                        type="button"
                        title="Delete"
                        disabled={
                          isDeleting
                        }
                        onClick={() =>
                          onDelete(
                            post
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#a23b2a] hover:bg-[#fbeae5] disabled:opacity-50"
                      >
                        <Trash2
                          size={
                            16
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

function getMediaUrl(
  asset:
    InstagramPost["mediaAsset"]
): string | null {
  if (!asset) {
    return null;
  }

  const preview =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "PREVIEW" &&
        Boolean(
          variant.publicUrl
        )
    );

  const thumbnail =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "THUMBNAIL" &&
        Boolean(
          variant.publicUrl
        )
    );

  const value =
    preview?.publicUrl ||
    thumbnail?.publicUrl ||
    asset.previewPath ||
    asset.thumbnailPath ||
    asset.publicUrl ||
    null;

  if (!value) {
    return null;
  }

  if (
    value.startsWith(
      "http://"
    ) ||
    value.startsWith(
      "https://"
    ) ||
    value.startsWith(
      "data:"
    ) ||
    value.startsWith(
      "blob:"
    )
  ) {
    return value;
  }

  const backendUrl =
    process.env
      .NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5080";

  const base =
    backendUrl.replace(
      /\/+$/,
      ""
    );

  let path =
    value.startsWith(
      "/"
    )
      ? value
      : `/${value}`;

  if (
    !path.startsWith(
      "/media/"
    )
  ) {
    path =
      `/media${path}`;
  }

  return `${base}${path}`;
}