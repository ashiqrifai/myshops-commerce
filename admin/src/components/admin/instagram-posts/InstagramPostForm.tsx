"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
    ArrowLeft,
    ExternalLink,
    ImageIcon,
    Images,
    LoaderCircle,
    Save,
    Settings2,
  } from "lucide-react";

import InstagramPostMediaPicker from "./InstagramPostMediaPicker";

import type {
  InstagramPostFormValues,
} from "@/types/instagramPost";

interface InstagramPostFormProps {
  initialValues?:
    Partial<InstagramPostFormValues>;

  isSaving:
    boolean;

  submitLabel?:
    string;

  onSubmit:
    (
      values:
        InstagramPostFormValues
    ) =>
      Promise<void> |
      void;
}

/*
|--------------------------------------------------------------------------
| Default Values
|--------------------------------------------------------------------------
*/

const defaultValues:
  InstagramPostFormValues = {
  mediaAssetId:
    null,

  instagramUrl:
    "",

  caption:
    null,

  altText:
    null,

  sortOrder:
    0,

  isActive:
    true,
};

/*
|--------------------------------------------------------------------------
| Instagram Post Form
|--------------------------------------------------------------------------
*/

export default function InstagramPostForm({
  initialValues,
  isSaving,
  submitLabel =
    "Save Instagram post",
  onSubmit,
}: InstagramPostFormProps) {
  const [
    values,
    setValues,
  ] =
    useState<InstagramPostFormValues>({
      ...defaultValues,
      ...initialValues,
    });

  /*
  |--------------------------------------------------------------------------
  | Sync Initial Values
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      setValues({
        ...defaultValues,
        ...initialValues,
      });
    },
    [
      initialValues,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Set Field
  |--------------------------------------------------------------------------
  */

  const setField = <
    K extends keyof InstagramPostFormValues
  >(
    field:
      K,

    value:
      InstagramPostFormValues[K]
  ) => {
    setValues(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      /*
       * Image required
       */

      if (
        !values.mediaAssetId
      ) {
        window.alert(
          "Instagram image is required."
        );

        return;
      }

      /*
       * Instagram URL required
       */

      const instagramUrl =
        values.instagramUrl
          .trim();

      if (
        !instagramUrl
      ) {
        window.alert(
          "Instagram post or reel URL is required."
        );

        return;
      }

      /*
       * Validate Instagram URL
       */

      try {
        const url =
          new URL(
            instagramUrl
          );

        const hostname =
          url.hostname
            .toLowerCase()
            .replace(
              /^www\./,
              ""
            );

        if (
          hostname !==
          "instagram.com"
        ) {
          throw new Error(
            "Invalid Instagram hostname."
          );
        }
      } catch {
        window.alert(
          "Please enter a valid Instagram URL."
        );

        return;
      }

      /*
       * Submit normalized values
       */

      await onSubmit({
        ...values,

        mediaAssetId:
          values.mediaAssetId,

        instagramUrl,

        caption:
          normalizeNullable(
            values.caption
          ),

        altText:
          normalizeNullable(
            values.altText
          ),

        sortOrder:
          Number(
            values.sortOrder ||
              0
          ),

        isActive:
          values.isActive,
      });
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="mx-auto w-full max-w-[1300px] px-5 py-6 md:px-8"
    >
      {/* Header */}

      <header className="mb-6">
        <Link
          href="/admin/instagram-posts"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6d7175] hover:text-[#303030]"
        >
          <ArrowLeft
            size={
              16
            }
          />

          Instagram Gallery
        </Link>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {initialValues
                ? "Edit Instagram post"
                : "Add Instagram post"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
              Manage an Instagram image and link displayed on the MyShops homepage.
            </p>
          </div>

          <button
            type="submit"
            disabled={
              isSaving
            }
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <LoaderCircle
                size={
                  17
                }
                className="animate-spin"
              />
            ) : (
              <Save
                size={
                  17
                }
              />
            )}

            {isSaving
              ? "Saving..."
              : submitLabel}
          </button>
        </div>
      </header>

      {/* Main Layout */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

        {/* Left */}

        <div className="space-y-6">

          {/* Instagram Image */}

          <FormCard
            icon={
              <ImageIcon
                size={
                  18
                }
              />
            }
            title="Instagram image"
            description="Choose the image that will appear in the homepage Instagram gallery."
          >
            <InstagramPostMediaPicker
              value={
                values.mediaAssetId
              }
              onChange={(
                value
              ) =>
                setField(
                  "mediaAssetId",
                  value
                )
              }
            />
          </FormCard>

          {/* Instagram Details */}

          <FormCard
            icon={
                <Images
                size={
                  18
                }
              />
            }
            title="Instagram post"
            description="Connect this gallery image to the original Instagram post or reel."
          >
            <FormField
              label="Instagram URL"
              required
              hint="Paste the full Instagram post or reel URL."
            >
              <input
                type="url"
                required
                value={
                  values.instagramUrl
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "instagramUrl",
                    event.target
                      .value
                  )
                }
                className="admin-input"
                placeholder="https://www.instagram.com/p/..."
              />
            </FormField>

            {values.instagramUrl ? (
              <a
                href={
                  values.instagramUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#005bd3] hover:underline"
              >
                <ExternalLink
                  size={
                    15
                  }
                />

                Open Instagram post
              </a>
            ) : null}

            <FormField
              label="Caption"
              hint="Optional text for internal reference or future storefront use."
            >
              <textarea
                value={
                  values.caption ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "caption",
                    event.target
                      .value
                  )
                }
                rows={
                  5
                }
                className="admin-input min-h-[130px] resize-y py-3"
                placeholder="Instagram post caption..."
              />
            </FormField>

            <FormField
              label="Image alt text"
              hint="Describe the image for accessibility and SEO."
            >
              <input
                value={
                  values.altText ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "altText",
                    event.target
                      .value
                  )
                }
                maxLength={
                  500
                }
                className="admin-input"
                placeholder="MyShops latest electronics..."
              />
            </FormField>
          </FormCard>
        </div>

        {/* Right */}

        <aside className="space-y-5">

          {/* Settings */}

          <FormCard
            icon={
              <Settings2
                size={
                  18
                }
              />
            }
            title="Display settings"
            description="Control homepage visibility and position."
          >
            <ToggleField
              label="Active"
              description="Show this item in the public Instagram gallery."
              checked={
                values.isActive
              }
              onChange={(
                checked
              ) =>
                setField(
                  "isActive",
                  checked
                )
              }
            />

            <FormField
              label="Sort order"
              hint="Lower numbers display first."
            >
              <input
                type="number"
                min={
                  0
                }
                value={
                  values.sortOrder
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "sortOrder",
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                className="admin-input"
              />
            </FormField>
          </FormCard>

          {/* Summary */}

          <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">
              Gallery summary
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow
                label="Status"
                value={
                  values.isActive
                    ? "Active"
                    : "Inactive"
                }
              />

              <SummaryRow
                label="Sort order"
                value={
                  String(
                    values.sortOrder
                  )
                }
              />

              <SummaryRow
                label="Image"
                value={
                  values.mediaAssetId
                    ? "Selected"
                    : "Not selected"
                }
              />

              <SummaryRow
                label="Instagram URL"
                value={
                  values.instagramUrl
                    ? "Added"
                    : "Not added"
                }
              />
            </dl>
          </section>

          {/* Sticky Save */}

          <div className="sticky bottom-4 rounded-2xl border border-[#e1e3e5] bg-white p-4 shadow-lg">
            <button
              type="submit"
              disabled={
                isSaving
              }
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <LoaderCircle
                  size={
                    17
                  }
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={
                    17
                  }
                />
              )}

              {isSaving
                ? "Saving..."
                : submitLabel}
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}

/*
|--------------------------------------------------------------------------
| Form Card
|--------------------------------------------------------------------------
*/

interface FormCardProps {
  title:
    string;

  description?:
    string;

  icon?:
    React.ReactNode;

  children:
    React.ReactNode;
}

function FormCard({
  title,
  description,
  icon,
  children,
}: FormCardProps) {
  return (
    <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 text-[#5c5f62]">
            {icon}
          </div>
        ) : null}

        <div>
          <h2 className="text-base font-semibold">
            {title}
          </h2>

          {description ? (
            <p className="mt-1 text-sm leading-6 text-[#6d7175]">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {children}
      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Form Field
|--------------------------------------------------------------------------
*/

interface FormFieldProps {
  label:
    string;

  hint?:
    string;

  required?:
    boolean;

  children:
    React.ReactNode;
}

function FormField({
  label,
  hint,
  required,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}

        {required ? (
          <span className="ml-1 text-[#d72c0d]">
            *
          </span>
        ) : null}
      </label>

      {children}

      {hint ? (
        <p className="mt-1.5 text-xs text-[#6d7175]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Toggle
|--------------------------------------------------------------------------
*/

interface ToggleFieldProps {
  label:
    string;

  description:
    string;

  checked:
    boolean;

  onChange:
    (
      checked:
        boolean
    ) => void;
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: ToggleFieldProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#e1e3e5] p-4 hover:bg-[#fafbfb]">
      <div>
        <p className="text-sm font-medium">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#6d7175]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={
          checked
        }
        onClick={() =>
          onChange(
            !checked
          )
        }
        className={[
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition",

          checked
            ? "bg-[#303030]"
            : "bg-[#babfc3]",
        ].join(
          " "
        )}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",

            checked
              ? "left-[22px]"
              : "left-0.5",
          ].join(
            " "
          )}
        />
      </button>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Summary Row
|--------------------------------------------------------------------------
*/

interface SummaryRowProps {
  label:
    string;

  value:
    string;
}

function SummaryRow({
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[#6d7175]">
        {label}
      </dt>

      <dd className="max-w-[190px] break-words text-right font-medium">
        {value}
      </dd>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Normalize Nullable
|--------------------------------------------------------------------------
*/

function normalizeNullable(
  value:
    string |
    null |
    undefined
): string | null {
  const normalized =
    value?.trim();

  return (
    normalized ||
    null
  );
}