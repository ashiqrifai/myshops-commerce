"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  FolderKanban,
  Save,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import {
  useCreateCollectionMutation,
} from "@/store/api/collectionApi";

import type {
  CollectionFormValues,
  CollectionType,
} from "@/types/collection";

const initialFormValues: CollectionFormValues = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",

  collectionType:
    "MANUAL",

  smartRules: {
    match:
      "ALL",
    rules: [
      {
        field:
          "EXPRESS_DELIVERY_ENABLED",
        operator:
          "IS",
        value:
          true,
      },
    ],
  },

  sortOrder:
    1,

  thumbnailAssetId:
    null,

  bannerAssetId:
    null,

  mobileBannerAssetId:
    null,

  landingPageId:
    null,

  isActive:
    true,

  isFeatured:
    false,

  showInMenu:
    false,

  showOnHome:
    false,

  isSearchable:
    true,

  showProductCount:
    true,

  publishedFrom:
    null,

  publishedUntil:
    null,

  metaTitle:
    "",

  metaDescription:
    "",

  metaKeywords:
    "",

  canonicalUrl:
    "",

  robotsIndex:
    true,

  robotsFollow:
    true,
};

export default function NewCollectionPage() {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] =
    useState<CollectionFormValues>(
      initialFormValues
    );

  const [
    slugEdited,
    setSlugEdited,
  ] =
    useState(false);

  const [
    createCollection,
    {
      isLoading:
        isCreating,
    },
  ] =
    useCreateCollectionMutation();

  const updateField = <
    K extends keyof CollectionFormValues,
  >(
    field:
      K,
    value:
      CollectionFormValues[K]
  ) => {
    setForm(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );
  };

  const handleNameChange =
    (
      value:
        string
    ) => {
      setForm(
        (
          current
        ) => ({
          ...current,

          name:
            value,

          slug:
            slugEdited
              ? current.slug
              : generateSlug(
                  value
                ),
        })
      );
    };

  const handleSlugChange =
    (
      value:
        string
    ) => {
      setSlugEdited(
        true
      );

      updateField(
        "slug",
        generateSlug(
          value
        )
      );
    };

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const name =
        form.name.trim();

      const slug =
        form.slug
          ?.trim() ||
        "";

      if (!name) {
        toast.error(
          "Collection name is required."
        );

        return;
      }

      if (!slug) {
        toast.error(
          "Collection slug is required."
        );

        return;
      }

      if (
        form.publishedFrom &&
        form.publishedUntil &&
        new Date(
          form.publishedUntil
        ).getTime() <
          new Date(
            form.publishedFrom
          ).getTime()
      ) {
        toast.error(
          "Publish until must be later than publish from."
        );

        return;
      }

      if (
        form.collectionType ===
          "SMART" &&
        !form.smartRules
          ?.rules?.length
      ) {
        toast.error(
          "Add at least one smart collection rule."
        );

        return;
      }

      try {
        const payload:
          CollectionFormValues =
          {
            ...form,

            name,

            slug,

            description:
              emptyToNull(
                form.description
              ),

            shortDescription:
              emptyToNull(
                form.shortDescription
              ),

            metaTitle:
              emptyToNull(
                form.metaTitle
              ),

            metaDescription:
              emptyToNull(
                form.metaDescription
              ),

            metaKeywords:
              emptyToNull(
                form.metaKeywords
              ),

            canonicalUrl:
              emptyToNull(
                form.canonicalUrl
              ),

            publishedFrom:
              localDateTimeToIso(
                form.publishedFrom
              ),

            publishedUntil:
              localDateTimeToIso(
                form.publishedUntil
              ),

            sortOrder:
              Math.max(
                1,
                Number(
                  form.sortOrder
                ) ||
                  1
              ),
          };

        const response =
          await createCollection(
            payload
          ).unwrap();

        toast.success(
          "Collection created successfully."
        );

        const collectionId =
          response?.data?.id;

        if (
          collectionId
        ) {
          router.push(
            `/admin/collections/${collectionId}`
          );

          return;
        }

        router.push(
          "/admin/collections"
        );
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to create collection."
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <form
        onSubmit={
          handleSubmit
        }
      >
        <div className="mx-auto w-full max-w-[1200px] px-5 py-6 md:px-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Link
                href="/admin/collections"
                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#4a4f53] hover:text-[#202223]"
              >
                <ArrowLeft
                  size={16}
                />

                Collections
              </Link>

              <div className="flex items-center gap-2">
                <FolderKanban
                  size={22}
                />

                <h1 className="text-2xl font-semibold tracking-tight">
                  Add collection
                </h1>
              </div>

              <p className="mt-2 text-sm text-[#6d7175]">
                Create a product
                collection for website,
                kiosk, navigation and
                promotional sections.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/collections"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] hover:bg-[#f6f6f7]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  isCreating
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save
                  size={17}
                />

                {isCreating
                  ? "Saving..."
                  : "Save collection"}
              </button>
            </div>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <FormCard
                title="Collection details"
                description="Enter the main information customers and administrators will see."
              >
                <div className="grid gap-5">
                  <Field
                    label="Collection name"
                    required
                  >
                    <input
                      value={
                        form.name
                      }
                      onChange={(
                        event
                      ) =>
                        handleNameChange(
                          event
                            .target
                            .value
                        )
                      }
                      className="admin-input"
                      placeholder="Example: Gaming laptops"
                      maxLength={
                        150
                      }
                      required
                    />
                  </Field>

                  <Field
                    label="Slug"
                    required
                    helpText="Used in the collection URL."
                  >
                    <div className="flex overflow-hidden rounded-lg border border-[#babfc3] bg-white focus-within:border-[#458fff] focus-within:ring-1 focus-within:ring-[#458fff]">
                      <span className="flex items-center border-r border-[#e1e3e5] bg-[#f6f6f7] px-3 text-sm text-[#6d7175]">
                        /collections/
                      </span>

                      <input
                        value={
                          form.slug
                        }
                        onChange={(
                          event
                        ) =>
                          handleSlugChange(
                            event
                              .target
                              .value
                          )
                        }
                        className="min-w-0 flex-1 border-0 px-3 py-2 text-sm outline-none"
                        placeholder="gaming-laptops"
                        maxLength={
                          180
                        }
                        required
                      />
                    </div>
                  </Field>

                  <Field
                    label="Short description"
                    helpText="A brief summary for collection cards and menus."
                  >
                    <textarea
                      value={
                        form.shortDescription ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "shortDescription",
                          event
                            .target
                            .value
                        )
                      }
                      className="admin-input min-h-24 resize-y"
                      placeholder="A short introduction to this collection."
                      maxLength={
                        300
                      }
                    />
                  </Field>

                  <Field
                    label="Description"
                    helpText="Detailed content shown on the collection page."
                  >
                    <textarea
                      value={
                        form.description ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "description",
                          event
                            .target
                            .value
                        )
                      }
                      className="admin-input min-h-40 resize-y"
                      placeholder="Describe the products included in this collection."
                    />
                  </Field>
                </div>
              </FormCard>

              <FormCard
                title="Collection type"
                description="Choose how products will be added to this collection."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <CollectionTypeOption
                    title="Manual"
                    description="Select and arrange products manually."
                    value="MANUAL"
                    selected={
                      form.collectionType ===
                      "MANUAL"
                    }
                    onSelect={(
                      value
                    ) =>
                      updateField(
                        "collectionType",
                        value
                      )
                    }
                  />

                  <CollectionTypeOption
                    title="Smart"
                    description="Products will be assigned using collection rules."
                    value="SMART"
                    selected={
                      form.collectionType ===
                      "SMART"
                    }
                    onSelect={(
                      value
                    ) =>
                      updateField(
                        "collectionType",
                        value
                      )
                    }
                  />
                </div>

                {form.collectionType ===
                  "SMART" ? (
                  <SmartCollectionRulesEditor
                    value={
                      form.smartRules
                    }
                    onChange={(
                      smartRules
                    ) =>
                      updateField(
                        "smartRules",
                        smartRules
                      )
                    }
                  />
                ) : null}
              </FormCard>

              <FormCard
                title="Media"
                description="Connect existing media assets to the collection."
              >
                <div className="grid gap-5">
                  <Field
                    label="Thumbnail asset ID"
                    helpText="Used in collection cards and admin listings."
                  >
                    <input
                      value={
                        form.thumbnailAssetId ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "thumbnailAssetId",
                          emptyToNull(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      className="admin-input"
                      placeholder="Media asset UUID"
                    />
                  </Field>

                  <Field
                    label="Banner asset ID"
                    helpText="Desktop banner shown on the collection page."
                  >
                    <input
                      value={
                        form.bannerAssetId ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "bannerAssetId",
                          emptyToNull(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      className="admin-input"
                      placeholder="Media asset UUID"
                    />
                  </Field>

                  <Field
                    label="Mobile banner asset ID"
                    helpText="Banner optimized for mobile screens."
                  >
                    <input
                      value={
                        form.mobileBannerAssetId ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "mobileBannerAssetId",
                          emptyToNull(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      className="admin-input"
                      placeholder="Media asset UUID"
                    />
                  </Field>
                </div>
              </FormCard>

              <FormCard
                title="Search engine listing"
                description="Control how this collection appears in search engines."
              >
                <div className="grid gap-5">
                  <Field
                    label="Page title"
                    helpText={`${String(
                      form.metaTitle ||
                        ""
                    ).length}/70 characters`}
                  >
                    <input
                      value={
                        form.metaTitle ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "metaTitle",
                          event
                            .target
                            .value
                        )
                      }
                      className="admin-input"
                      placeholder={
                        form.name ||
                        "Collection page title"
                      }
                      maxLength={
                        70
                      }
                    />
                  </Field>

                  <Field
                    label="Meta description"
                    helpText={`${String(
                      form.metaDescription ||
                        ""
                    ).length}/160 characters`}
                  >
                    <textarea
                      value={
                        form.metaDescription ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "metaDescription",
                          event
                            .target
                            .value
                        )
                      }
                      className="admin-input min-h-28 resize-y"
                      placeholder="Describe this collection for search results."
                      maxLength={
                        160
                      }
                    />
                  </Field>

                  <Field
                    label="Meta keywords"
                    helpText="Separate keywords with commas."
                  >
                    <input
                      value={
                        form.metaKeywords ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "metaKeywords",
                          event
                            .target
                            .value
                        )
                      }
                      className="admin-input"
                      placeholder="gaming, laptops, accessories"
                    />
                  </Field>

                  <Field
                    label="Canonical URL"
                  >
                    <input
                      type="url"
                      value={
                        form.canonicalUrl ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "canonicalUrl",
                          event
                            .target
                            .value
                        )
                      }
                      className="admin-input"
                      placeholder="https://www.myshops.ae/collections/gaming-laptops"
                    />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <CheckboxField
                      label="Allow indexing"
                      description="Allow search engines to include this collection."
                      checked={
                        form.robotsIndex ?? false
                      }
                      onChange={(
                        checked
                      ) =>
                        updateField(
                          "robotsIndex",
                          checked
                        )
                      }
                    />

                    <CheckboxField
                      label="Follow links"
                      description="Allow search engines to follow product links."
                      checked={
                        form.robotsFollow ?? false
                      }
                      onChange={(
                        checked
                      ) =>
                        updateField(
                          "robotsFollow",
                          checked
                        )
                      }
                    />
                  </div>
                </div>
              </FormCard>
            </div>

            <aside className="space-y-6">
              <FormCard
                title="Status"
                description="Control whether the collection can be published."
              >
                <CheckboxField
                  label="Active"
                  description="Make this collection available according to its publishing dates."
                  checked={
                    form.isActive ?? false
                  }
                  onChange={(
                    checked
                  ) =>
                    updateField(
                      "isActive",
                      checked
                    )
                  }
                />
              </FormCard>

              <FormCard
                title="Visibility"
                description="Choose where this collection can appear."
              >
                <div className="space-y-3">
                  <CheckboxField
                    label="Featured"
                    description="Highlight this collection in featured areas."
                    checked={
                      form.isFeatured ?? false
                    }
                    onChange={(
                      checked
                    ) =>
                      updateField(
                        "isFeatured",
                        checked
                      )
                    }
                  />

                  <CheckboxField
                    label="Show in menu"
                    description="Allow this collection to be selected in navigation."
                    checked={
                      form.showInMenu ?? false
                    }
                    onChange={(
                      checked
                    ) =>
                      updateField(
                        "showInMenu",
                        checked
                      )
                    }
                  />

                  <CheckboxField
                    label="Show on homepage"
                    description="Allow this collection to appear in homepage sections."
                    checked={
                      form.showOnHome ?? false
                    }
                    onChange={(
                      checked
                    ) =>
                      updateField(
                        "showOnHome",
                        checked
                      )
                    }
                  />

                  <CheckboxField
                    label="Searchable"
                    description="Include the collection in storefront search."
                    checked={
                      form.isSearchable ?? false
                    }
                    onChange={(
                      checked
                    ) =>
                      updateField(
                        "isSearchable",
                        checked
                      )
                    }
                  />

                  <CheckboxField
                    label="Show product count"
                    description="Display the number of products to customers."
                    checked={
                      form.showProductCount ?? false
                    }
                    onChange={(
                      checked
                    ) =>
                      updateField(
                        "showProductCount",
                        checked
                      )
                    }
                  />
                </div>
              </FormCard>

              <FormCard
                title="Publishing"
                description="Optionally schedule when the collection is available."
              >
                <div className="grid gap-5">
                  <Field
                    label="Publish from"
                  >
                    <input
                      type="datetime-local"
                      value={
                        isoToLocalDateTime(
                          form.publishedFrom
                        )
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "publishedFrom",
                          event
                            .target
                            .value ||
                            null
                        )
                      }
                      className="admin-input"
                    />
                  </Field>

                  <Field
                    label="Publish until"
                  >
                    <input
                      type="datetime-local"
                      value={
                        isoToLocalDateTime(
                          form.publishedUntil
                        )
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "publishedUntil",
                          event
                            .target
                            .value ||
                            null
                        )
                      }
                      className="admin-input"
                    />
                  </Field>
                </div>
              </FormCard>

              <FormCard
                title="Organization"
              >
                <div className="grid gap-5">
                  <Field
                    label="Sort order"
                    helpText="Lower numbers appear first."
                  >
                    <input
                      type="number"
                      min={
                        1
                      }
                      step={
                        1
                      }
                      value={
                        form.sortOrder
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "sortOrder",
                          Math.max(
                            1,
                            Number(
                              event
                                .target
                                .value
                            ) ||
                              1
                          )
                        )
                      }
                      className="admin-input"
                    />
                  </Field>

                  <Field
                    label="Landing page ID"
                    helpText="Optional CMS landing page UUID."
                  >
                    <input
                      value={
                        form.landingPageId ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "landingPageId",
                          emptyToNull(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      className="admin-input"
                      placeholder="CMS page UUID"
                    />
                  </Field>
                </div>
              </FormCard>
            </aside>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#e1e3e5] pt-6">
            <Link
              href="/admin/collections"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] hover:bg-[#f6f6f7]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                isCreating
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save
                size={17}
              />

              {isCreating
                ? "Saving..."
                : "Save collection"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

function FormCard({
  title,
  description,
  children,
}: {
  title:
    string;

  description?:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
      <div className="border-b border-[#e1e3e5] px-5 py-4">
        <h2 className="text-base font-semibold text-[#202223]">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm leading-5 text-[#6d7175]">
            {description}
          </p>
        )}
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  helpText,
  required = false,
  children,
}: {
  label:
    string;

  helpText?:
    string;

  required?:
    boolean;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#202223]">
        {label}

        {required && (
          <span className="ml-1 text-red-600">
            *
          </span>
        )}
      </span>

      {children}

      {helpText && (
        <span className="mt-1.5 block text-xs leading-5 text-[#6d7175]">
          {helpText}
        </span>
      )}
    </label>
  );
}

function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label:
    string;

  description:
    string;

  checked:
    boolean;

  onChange: (
    checked:
      boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e1e3e5] p-3 hover:bg-[#fafafa]">
      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .checked
          )
        }
        className="mt-0.5 h-4 w-4 rounded border-[#8c9196]"
      />

      <span>
        <span className="block text-sm font-medium text-[#202223]">
          {label}
        </span>

        <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
          {description}
        </span>
      </span>
    </label>
  );
}


const SMART_RULE_FIELD_OPTIONS = [
  {
    value:
      "EXPRESS_DELIVERY_ENABLED",
    label:
      "Express Delivery Enabled",
    kind:
      "BOOLEAN",
  },
  {
    value:
      "STATUS",
    label:
      "Product Status",
    kind:
      "STATUS",
  },
  {
    value:
      "IS_FEATURED",
    label:
      "Featured",
    kind:
      "BOOLEAN",
  },
  {
    value:
      "IS_SEARCHABLE",
    label:
      "Searchable",
    kind:
      "BOOLEAN",
  },
  {
    value:
      "PRODUCT_TYPE",
    label:
      "Product Type",
    kind:
      "PRODUCT_TYPE",
  },
] as const;

function SmartCollectionRulesEditor({
  value,
  onChange,
}: {
  value:
    import("@/types/collection")
      .SmartCollectionRules |
    null |
    undefined;

  onChange: (
    value:
      import("@/types/collection")
        .SmartCollectionRules
  ) => void;
}) {
  const rules =
    value?.rules?.length
      ? value.rules
      : [
          {
            field:
              "EXPRESS_DELIVERY_ENABLED" as const,
            operator:
              "IS" as const,
            value:
              true,
          },
        ];

  const match =
    value?.match ||
    "ALL";

  const updateRule = (
    index:
      number,
    patch:
      Partial<
        import("@/types/collection")
          .SmartCollectionRule
      >
  ) => {
    const next =
      rules.map(
        (
          rule,
          ruleIndex
        ) =>
          ruleIndex ===
          index
            ? {
                ...rule,
                ...patch,
              }
            : rule
      );

    onChange({
      match,
      rules:
        next,
    });
  };

  const addRule =
    () => {
      onChange({
        match,
        rules: [
          ...rules,
          {
            field:
              "EXPRESS_DELIVERY_ENABLED",
            operator:
              "IS",
            value:
              true,
          },
        ],
      });
    };

  const removeRule = (
    index:
      number
  ) => {
    if (
      rules.length <=
      1
    ) {
      return;
    }

    onChange({
      match,
      rules:
        rules.filter(
          (
            _rule,
            ruleIndex
          ) =>
            ruleIndex !==
            index
        ),
    });
  };

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Smart Collection Rules
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Products matching these conditions are assigned automatically.
          </p>
        </div>

        <label className="block min-w-[190px]">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Match
          </span>

          <select
            value={
              match
            }
            onChange={(
              event
            ) =>
              onChange({
                match:
                  event.target
                    .value as
                    import("@/types/collection")
                      .SmartCollectionMatch,
                rules,
              })
            }
            className="admin-input"
          >
            <option value="ALL">
              All conditions
            </option>

            <option value="ANY">
              Any condition
            </option>
          </select>
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {rules.map(
          (
            rule,
            index
          ) => {
            const fieldOption =
              SMART_RULE_FIELD_OPTIONS
                .find(
                  (
                    option
                  ) =>
                    option.value ===
                    rule.field
                ) ||
              SMART_RULE_FIELD_OPTIONS[
                0
              ];

            return (
              <div
                key={
                  `${rule.field}-${index}`
                }
                className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1.5fr)_150px_minmax(0,1fr)_auto]"
              >
                <label>
                  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Field
                  </span>

                  <select
                    value={
                      rule.field
                    }
                    onChange={(
                      event
                    ) => {
                      const field =
                        event.target
                          .value as
                          import("@/types/collection")
                            .SmartCollectionRuleField;

                      const option =
                        SMART_RULE_FIELD_OPTIONS
                          .find(
                            (
                              item
                            ) =>
                              item.value ===
                              field
                          );

                      updateRule(
                        index,
                        {
                          field,
                          value:
                            option
                              ?.kind ===
                            "BOOLEAN"
                              ? true
                              : option
                                  ?.kind ===
                                "STATUS"
                                ? "ACTIVE"
                                : "SIMPLE",
                        }
                      );
                    }}
                    className="admin-input"
                  >
                    {SMART_RULE_FIELD_OPTIONS.map(
                      (
                        option
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Operator
                  </span>

                  <select
                    value={
                      rule.operator
                    }
                    onChange={(
                      event
                    ) =>
                      updateRule(
                        index,
                        {
                          operator:
                            event.target
                              .value as
                              import("@/types/collection")
                                .SmartCollectionRuleOperator,
                        }
                      )
                    }
                    className="admin-input"
                  >
                    <option value="IS">
                      Is
                    </option>

                    <option value="IS_NOT">
                      Is not
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Value
                  </span>

                  {fieldOption.kind ===
                  "BOOLEAN" ? (
                    <select
                      value={
                        rule.value ===
                        false
                          ? "FALSE"
                          : "TRUE"
                      }
                      onChange={(
                        event
                      ) =>
                        updateRule(
                          index,
                          {
                            value:
                              event.target
                                .value ===
                              "TRUE",
                          }
                        )
                      }
                      className="admin-input"
                    >
                      <option value="TRUE">
                        Yes
                      </option>

                      <option value="FALSE">
                        No
                      </option>
                    </select>
                  ) : fieldOption.kind ===
                    "STATUS" ? (
                    <select
                      value={
                        String(
                          rule.value ||
                          "ACTIVE"
                        )
                      }
                      onChange={(
                        event
                      ) =>
                        updateRule(
                          index,
                          {
                            value:
                              event.target
                                .value,
                          }
                        )
                      }
                      className="admin-input"
                    >
                      <option value="ACTIVE">
                        Active
                      </option>
                      <option value="DRAFT">
                        Draft
                      </option>
                      <option value="INACTIVE">
                        Inactive
                      </option>
                      <option value="ARCHIVED">
                        Archived
                      </option>
                    </select>
                  ) : (
                    <select
                      value={
                        String(
                          rule.value ||
                          "SIMPLE"
                        )
                      }
                      onChange={(
                        event
                      ) =>
                        updateRule(
                          index,
                          {
                            value:
                              event.target
                                .value,
                          }
                        )
                      }
                      className="admin-input"
                    >
                      <option value="SIMPLE">
                        Simple
                      </option>
                      <option value="VARIABLE">
                        Variable
                      </option>
                      <option value="BUNDLE">
                        Bundle
                      </option>
                      <option value="SERVICE">
                        Service
                      </option>
                    </select>
                  )}
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={
                      rules.length <=
                      1
                    }
                    onClick={() =>
                      removeRule(
                        index
                      )
                    }
                    className="h-10 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>

      <button
        type="button"
        onClick={
          addRule
        }
        className="mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        + Add Rule
      </button>
    </div>
  );
}

function CollectionTypeOption({
  title,
  description,
  value,
  selected,
  onSelect,
}: {
  title:
    string;

  description:
    string;

  value:
    CollectionType;

  selected:
    boolean;

  onSelect: (
    value:
      CollectionType
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onSelect(
          value
        )
      }
      className={[
        "rounded-xl border p-4 text-left transition",
        selected
          ? "border-[#303030] bg-[#f6f6f7] ring-1 ring-[#303030]"
          : "border-[#e1e3e5] bg-white hover:border-[#babfc3]",
      ].join(
        " "
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={[
            "flex h-4 w-4 items-center justify-center rounded-full border",
            selected
              ? "border-[#303030]"
              : "border-[#8c9196]",
          ].join(
            " "
          )}
        >
          {selected && (
            <span className="h-2 w-2 rounded-full bg-[#303030]" />
          )}
        </span>

        <span className="text-sm font-semibold text-[#202223]">
          {title}
        </span>
      </span>

      <span className="mt-2 block pl-7 text-xs leading-5 text-[#6d7175]">
        {description}
      </span>
    </button>
  );
}

function generateSlug(
  value:
    string
): string {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /['’]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function emptyToNull(
  value:
    string |
    null |
    undefined
): string | null {
  const trimmed =
    String(
      value ||
        ""
    ).trim();

  return trimmed ||
    null;
}

function localDateTimeToIso(
  value:
    string |
    null |
    undefined
): string | null {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function isoToLocalDateTime(
  value:
    string |
    null |
    undefined
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value.slice(
      0,
      16
    );
  }

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset *
          60 *
          1000
    );

  return localDate
    .toISOString()
    .slice(
      0,
      16
    );
}

function getApiErrorMessage(
  error:
    unknown,
  fallback:
    string
): string {
  if (
    typeof error !==
      "object" ||
    error === null
  ) {
    return fallback;
  }

  const apiError =
    error as {
      data?: {
        error?: {
          message?:
            string;
        };

        message?:
          string;

        errors?: Array<{
          message?:
            string;
        }>;
      };
    };

  return (
    apiError.data?.error
      ?.message ||
    apiError.data?.message ||
    apiError.data?.errors?.[0]
      ?.message ||
    fallback
  );
}