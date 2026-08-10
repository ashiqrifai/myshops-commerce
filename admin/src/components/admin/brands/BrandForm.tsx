"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Badge,
  FileText,
  ImageIcon,
  LoaderCircle,
  Save,
  Settings2,
} from "lucide-react";

import BrandMediaPicker from "./BrandMediaPicker";

import type {
  BrandFormValues,
} from "@/types/brand";

interface BrandFormProps {
  initialValues?:
    Partial<BrandFormValues>;

  isSaving:
    boolean;

  submitLabel?:
    string;

  onSubmit:
    (
      values:
        BrandFormValues
    ) =>
      Promise<void> | void;
}

const defaultValues:
  BrandFormValues = {
  name: "",
  code: "",
  slug: "",

  description:
    null,

  logoAssetId:
    null,

  bannerAssetId:
    null,

  websiteUrl:
    null,

  countryOfOrigin:
    null,

  isActive:
    true,

  isFeatured:
    false,

  sortOrder:
    0,

  metaTitle:
    null,

  metaDescription:
    null,

  metaKeywords:
    null,
};

export default function BrandForm({
  initialValues,
  isSaving,
  submitLabel =
    "Save brand",
  onSubmit,
}: BrandFormProps) {
  const [
    values,
    setValues,
  ] =
    useState<BrandFormValues>({
      ...defaultValues,
      ...initialValues,
    });

  const [
    slugWasEdited,
    setSlugWasEdited,
  ] =
    useState(
      Boolean(
        initialValues?.slug
      )
    );

  const [
    codeWasEdited,
    setCodeWasEdited,
  ] =
    useState(
      Boolean(
        initialValues?.code
      )
    );

  useEffect(() => {
    setValues({
      ...defaultValues,
      ...initialValues,
    });

    setSlugWasEdited(
      Boolean(
        initialValues?.slug
      )
    );

    setCodeWasEdited(
      Boolean(
        initialValues?.code
      )
    );
  }, [
    initialValues,
  ]);

  const setField = <
    K extends keyof BrandFormValues
  >(
    field:
      K,
    value:
      BrandFormValues[K]
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

  const handleNameChange = (
    name:
      string
  ) => {
    setField(
      "name",
      name
    );

    if (
      !slugWasEdited
    ) {
      setField(
        "slug",
        generateSlug(
          name
        )
      );
    }

    if (
      !codeWasEdited
    ) {
      setField(
        "code",
        generateCode(
          name
        )
      );
    }
  };

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const name =
        values.name.trim();

      if (!name) {
        window.alert(
          "Brand name is required."
        );

        return;
      }

      await onSubmit({
        ...values,

        name,

        code:
          values.code
            .trim() ||
          generateCode(
            name
          ),

        slug:
          values.slug
            .trim() ||
          generateSlug(
            name
          ),

        description:
          normalizeNullable(
            values.description
          ),

        logoAssetId:
          normalizeNullable(
            values.logoAssetId
          ),

        bannerAssetId:
          normalizeNullable(
            values.bannerAssetId
          ),

        websiteUrl:
          normalizeNullable(
            values.websiteUrl
          ),

        countryOfOrigin:
          normalizeNullable(
            values.countryOfOrigin
          ),

        metaTitle:
          normalizeNullable(
            values.metaTitle
          ),

        metaDescription:
          normalizeNullable(
            values.metaDescription
          ),

        metaKeywords:
          normalizeNullable(
            values.metaKeywords
          ),

        sortOrder:
          Number(
            values.sortOrder ||
              0
          ),
      });
    };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="mx-auto w-full max-w-[1300px] px-5 py-6 md:px-8"
    >
      <header className="mb-6">
        <Link
          href="/admin/brands"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6d7175] hover:text-[#303030]"
        >
          <ArrowLeft
            size={16}
          />

          Brands
        </Link>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {initialValues
                ? "Edit brand"
                : "Create brand"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
              Manage brand identity,
              media, catalogue status
              and search metadata.
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
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save
                size={17}
              />
            )}

            {isSaving
              ? "Saving..."
              : submitLabel}
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <FormCard
            icon={
              <Badge
                size={18}
              />
            }
            title="Brand identity"
            description="Basic brand information used throughout the catalogue."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="Brand name"
                required
              >
                <input
                  value={
                    values.name
                  }
                  onChange={(
                    event
                  ) =>
                    handleNameChange(
                      event.target
                        .value
                    )
                  }
                  className="admin-input"
                  placeholder="Apple"
                  required
                />
              </FormField>

              <FormField
                label="Brand code"
                hint="Internal unique code."
              >
                <input
                  value={
                    values.code
                  }
                  onChange={(
                    event
                  ) => {
                    setCodeWasEdited(
                      true
                    );

                    setField(
                      "code",
                      generateCode(
                        event.target
                          .value
                      )
                    );
                  }}
                  className="admin-input"
                  placeholder="APPLE"
                />
              </FormField>

              <FormField
                label="URL slug"
                hint="Used in brand URLs."
              >
                <input
                  value={
                    values.slug
                  }
                  onChange={(
                    event
                  ) => {
                    setSlugWasEdited(
                      true
                    );

                    setField(
                      "slug",
                      generateSlug(
                        event.target
                          .value
                      )
                    );
                  }}
                  className="admin-input"
                  placeholder="apple"
                />
              </FormField>

              <FormField
                label="Country of origin"
              >
                <input
                  value={
                    values.countryOfOrigin ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setField(
                      "countryOfOrigin",
                      event.target
                        .value
                    )
                  }
                  className="admin-input"
                  placeholder="United States"
                />
              </FormField>
            </div>

            <FormField
              label="Official website"
            >
              <input
                type="url"
                value={
                  values.websiteUrl ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "websiteUrl",
                    event.target
                      .value
                  )
                }
                className="admin-input"
                placeholder="https://www.apple.com"
              />
            </FormField>

            <FormField
              label="Description"
            >
              <textarea
                value={
                  values.description ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "description",
                    event.target
                      .value
                  )
                }
                rows={7}
                className="admin-input min-h-[170px] resize-y py-3"
              />
            </FormField>
          </FormCard>

          <FormCard
            icon={
              <ImageIcon
                size={18}
              />
            }
            title="Brand media"
            description="Select the logo and banner from Media Studio."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <BrandMediaPicker
                label="Brand logo"
                description="Used in brand listings, filters and product pages."
                value={
                  values.logoAssetId
                }
                onChange={(
                  value
                ) =>
                  setField(
                    "logoAssetId",
                    value
                  )
                }
              />

              <BrandMediaPicker
                label="Brand banner"
                description="Wide banner for the brand landing page."
                value={
                  values.bannerAssetId
                }
                onChange={(
                  value
                ) =>
                  setField(
                    "bannerAssetId",
                    value
                  )
                }
                wide
              />
            </div>
          </FormCard>

          <FormCard
            icon={
              <FileText
                size={18}
              />
            }
            title="Search engine optimization"
            description="Control how the brand appears in search results."
          >
            <FormField
              label="Meta title"
            >
              <input
                value={
                  values.metaTitle ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "metaTitle",
                    event.target
                      .value
                  )
                }
                maxLength={
                  250
                }
                className="admin-input"
              />
            </FormField>

            <FormField
              label="Meta description"
            >
              <textarea
                value={
                  values.metaDescription ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "metaDescription",
                    event.target
                      .value
                  )
                }
                maxLength={
                  500
                }
                rows={4}
                className="admin-input min-h-[110px] resize-y py-3"
              />
            </FormField>

            <FormField
              label="Meta keywords"
            >
              <textarea
                value={
                  values.metaKeywords ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "metaKeywords",
                    event.target
                      .value
                  )
                }
                rows={3}
                className="admin-input min-h-[90px] resize-y py-3"
                placeholder="apple, iphone, macbook"
              />
            </FormField>
          </FormCard>
        </div>

        <aside className="space-y-5">
          <FormCard
            icon={
              <Settings2
                size={18}
              />
            }
            title="Catalogue settings"
            description="Control availability and display priority."
          >
            <ToggleField
              label="Active"
              description="Allow this brand to be assigned to products."
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

            <ToggleField
              label="Featured"
              description="Allow this brand to appear in featured brand sections."
              checked={
                values.isFeatured
              }
              onChange={(
                checked
              ) =>
                setField(
                  "isFeatured",
                  checked
                )
              }
            />

            <FormField
              label="Sort order"
              hint="Lower values display first."
            >
              <input
                type="number"
                min={0}
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

          <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">
              Brand summary
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow
                label="Code"
                value={
                  values.code ||
                  generateCode(
                    values.name
                  ) ||
                  "—"
                }
              />

              <SummaryRow
                label="URL"
                value={`/${
                  values.slug ||
                  generateSlug(
                    values.name
                  ) ||
                  "brand"
                }`}
                mono
              />

              <SummaryRow
                label="Status"
                value={
                  values.isActive
                    ? "Active"
                    : "Inactive"
                }
              />

              <SummaryRow
                label="Featured"
                value={
                  values.isFeatured
                    ? "Yes"
                    : "No"
                }
              />
            </dl>
          </section>

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
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={17}
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
        {icon && (
          <div className="mt-0.5 text-[#5c5f62]">
            {icon}
          </div>
        )}

        <div>
          <h2 className="text-base font-semibold">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm leading-6 text-[#6d7175]">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {children}
      </div>
    </section>
  );
}

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

        {required && (
          <span className="ml-1 text-[#d72c0d]">
            *
          </span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-xs text-[#6d7175]">
          {hint}
        </p>
      )}
    </div>
  );
}

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

interface SummaryRowProps {
  label:
    string;

  value:
    string;

  mono?:
    boolean;
}

function SummaryRow({
  label,
  value,
  mono = false,
}: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[#6d7175]">
        {label}
      </dt>

      <dd
        className={[
          "max-w-[190px] break-words text-right font-medium",
          mono
            ? "font-mono text-xs"
            : "",
        ].join(
          " "
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function generateSlug(
  value:
    string
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/&/g, " and ")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .replace(
      /-{2,}/g,
      "-"
    );
}

function generateCode(
  value:
    string
): string {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/&/g, " AND ")
    .replace(
      /[^A-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    )
    .replace(
      /_{2,}/g,
      "_"
    );
}

function normalizeNullable(
  value:
    string | null | undefined
): string | null {
  const normalized =
    value?.trim();

  return normalized ||
    null;
}
