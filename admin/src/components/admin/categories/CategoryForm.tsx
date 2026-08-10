"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ChevronDown,
  FileText,
  FolderTree,
  ImageIcon,
  LoaderCircle,
  Save,
  Settings2,
} from "lucide-react";

import ParentCategorySelector from "./ParentCategorySelector";
import CategoryMediaPicker from "./CategoryMediaPicker";

import {
  useGetCmsPagesQuery,
} from "@/store/api/cmsPagesApi";


import {
  useGetCategoryTreeQuery,
} from "@/store/api/categoryApi";

import type {
  Category,
  CategoryFormValues,
} from "@/types/category";

interface CategoryFormProps {
  initialValues?:
    Partial<CategoryFormValues>;

  currentCategoryId?:
    string;

  isSaving:
    boolean;

  submitLabel?:
    string;

  onSubmit:
    (
      values:
        CategoryFormValues
    ) =>
      Promise<void> | void;
}

const defaultValues:
  CategoryFormValues = {
  name: "",
  slug: "",

  parentCategoryId:
    null,

  description:
    null,

  shortDescription:
    null,

  sortOrder: 0,

  thumbnailAssetId:
    null,

  imageAssetId:
    null,

  bannerAssetId:
    null,

  landingPageId:
    null,

  iconName:
    null,

  iconUrl:
    null,

  isActive: true,
  showInMenu: true,
  showOnHome: false,
  isFeatured: false,
  isSearchable: true,

  metaTitle:
    null,

  metaDescription:
    null,

  metaKeywords:
    null,

  canonicalUrl:
    null,

  robotsIndex: true,
  robotsFollow: true,
};

export default function CategoryForm({
  initialValues,
  currentCategoryId,
  isSaving,
  submitLabel =
    "Save category",
  onSubmit,
}: CategoryFormProps) {
  const [
    values,
    setValues,
  ] =
    useState<CategoryFormValues>({
      ...defaultValues,
      ...initialValues,
    });

  const [
    slugWasEdited,
    setSlugWasEdited,
  ] = useState(
    Boolean(
      initialValues?.slug
    )
  );

  const [
    showAdvancedSeo,
    setShowAdvancedSeo,
  ] = useState(false);

  const {
    data:
      treeResponse,
    isLoading:
      isTreeLoading,
  } =
    useGetCategoryTreeQuery();

  const categoryTree =
    treeResponse?.data
      .categories || [];

  const {
    data:
      cmsPagesResponse,
    isLoading:
      isCmsPagesLoading,
  } =
    useGetCmsPagesQuery({
      page: 1,
      pageSize: 200,
      isActive: true,
      sortBy: "name",
      sortDirection: "ASC",
    });

  const cmsPages =
    cmsPagesResponse?.data ||
    [];

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
  }, [
    initialValues,
  ]);

  const flattenedCategories =
    useMemo(
      () =>
        flattenCategories(
          categoryTree
        ),
      [categoryTree]
    );

  const selectedParent =
    useMemo(
      () =>
        flattenedCategories.find(
          (
            category
          ) =>
            category.id ===
            values.parentCategoryId
        ) || null,
      [
        flattenedCategories,
        values.parentCategoryId,
      ]
    );

  const categoryPathPreview =
    selectedParent
      ? `${
          selectedParent.categoryPath ||
          selectedParent.name
        } > ${
          values.name ||
          "New category"
        }`
      : values.name ||
        "New category";

  const setField = <
    K extends keyof CategoryFormValues
  >(
    field:
      K,
    value:
      CategoryFormValues[K]
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

  const handleNameChange =
    (
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
          "Category name is required."
        );

        return;
      }

      await onSubmit({
        ...values,

        name,

        slug:
          values.slug
            ?.trim() ||
          generateSlug(
            name
          ),

        description:
          normalizeNullable(
            values.description
          ),

        shortDescription:
          normalizeNullable(
            values.shortDescription
          ),

        thumbnailAssetId:
          normalizeNullable(
            values.thumbnailAssetId
          ),

        imageAssetId:
          normalizeNullable(
            values.imageAssetId
          ),

        bannerAssetId:
          normalizeNullable(
            values.bannerAssetId
          ),

        landingPageId:
          normalizeNullable(
            values.landingPageId
          ),

        iconName:
          normalizeNullable(
            values.iconName
          ),

        iconUrl:
          normalizeNullable(
            values.iconUrl
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

        canonicalUrl:
          normalizeNullable(
            values.canonicalUrl
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
          href="/admin/categories"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6d7175] hover:text-[#303030]"
        >
          <ArrowLeft
            size={16}
          />

          Categories
        </Link>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {currentCategoryId
                ? "Edit category"
                : "Create category"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
              Configure hierarchy,
              catalogue visibility,
              media and SEO settings.
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
              <FolderTree
                size={18}
              />
            }
            title="Category details"
            description="Basic customer-facing information."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="Category name"
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
                      event
                        .target
                        .value
                    )
                  }
                  className="admin-input"
                  placeholder="Mobile phones"
                  required
                />
              </FormField>

              <FormField
                label="URL slug"
                hint="Used in the category URL."
              >
                <input
                  value={
                    values.slug ||
                    ""
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
                        event
                          .target
                          .value
                      )
                    );
                  }}
                  className="admin-input"
                  placeholder="mobile-phones"
                />
              </FormField>
            </div>

            <FormField
              label="Short description"
              hint="Used in cards and compact category listings."
            >
              <textarea
                value={
                  values.shortDescription ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "shortDescription",
                    event
                      .target
                      .value
                  )
                }
                rows={3}
                maxLength={
                  500
                }
                className="admin-input min-h-[96px] resize-y py-3"
              />
            </FormField>

            <FormField
              label="Full description"
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
                    event
                      .target
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
              <FolderTree
                size={18}
              />
            }
            title="Hierarchy"
            description="Choose the parent and display order."
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Parent category
                </label>

                <ParentCategorySelector
                  categories={
                    categoryTree
                  }
                  value={
                    values.parentCategoryId
                  }
                  currentCategoryId={
                    currentCategoryId
                  }
                  isLoading={
                    isTreeLoading
                  }
                  onChange={(
                    categoryId
                  ) =>
                    setField(
                      "parentCategoryId",
                      categoryId
                    )
                  }
                />
              </div>

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
                        event
                          .target
                          .value
                      )
                    )
                  }
                  className="admin-input"
                />
              </FormField>
            </div>

            <div className="rounded-xl bg-[#f6f6f7] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6d7175]">
                Category path preview
              </p>

              <p className="mt-2 text-sm font-medium">
                {categoryPathPreview}
              </p>
            </div>
          </FormCard>

          <FormCard
            icon={
              <ImageIcon
                size={18}
              />
            }
            title="Media and linked content"
            description="Connect assets from Media Studio and an optional CMS landing page."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <CategoryMediaPicker
                label="Thumbnail image"
                description="Used in compact category cards and lists."
                value={
                  values.thumbnailAssetId
                }
                onChange={(
                  value
                ) =>
                  setField(
                    "thumbnailAssetId",
                    value
                  )
                }
              />

              <CategoryMediaPicker
                label="Primary category image"
                description="Main image used on the category page."
                value={
                  values.imageAssetId
                }
                onChange={(
                  value
                ) =>
                  setField(
                    "imageAssetId",
                    value
                  )
                }
              />

              <div className="md:col-span-2">
                <CategoryMediaPicker
                  label="Category banner"
                  description="Wide banner displayed at the top of the category page."
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
                />
              </div>

              <FormField
                label="CMS landing page"
                hint="Optional CMS page used as the category landing experience."
              >
                <select
                  value={
                    values.landingPageId ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setField(
                      "landingPageId",
                      event.target.value ||
                        null
                    )
                  }
                  disabled={
                    isCmsPagesLoading
                  }
                  className="admin-input"
                >
                  <option value="">
                    {isCmsPagesLoading
                      ? "Loading CMS pages..."
                      : "No linked CMS page"}
                  </option>

                  {cmsPages.map(
                    (page) => (
                      <option
                        key={
                          page.id
                        }
                        value={
                          page.id
                        }
                      >
                        {page.name} —{" "}
                        {page.pageType} —{" "}
                        {page.status}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField
                label="Icon name"
              >
                <input
                  value={
                    values.iconName ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setField(
                      "iconName",
                      event.target.value
                    )
                  }
                  className="admin-input"
                  placeholder="smartphone"
                />
              </FormField>

              <FormField
                label="Custom icon URL"
              >
                <input
                  value={
                    values.iconUrl ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setField(
                      "iconUrl",
                      event.target.value
                    )
                  }
                  className="admin-input"
                  placeholder="https://..."
                />
              </FormField>
            </div>
          </FormCard>

          <FormCard
            icon={
              <FileText
                size={18}
              />
            }
            title="Search engine optimization"
            description="Control how the category appears in search results."
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
                    event
                      .target
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
                    event
                      .target
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

            <button
              type="button"
              onClick={() =>
                setShowAdvancedSeo(
                  (
                    current
                  ) =>
                    !current
                )
              }
              className="flex items-center gap-2 text-sm font-medium text-[#005bd3]"
            >
              <ChevronDown
                size={16}
                className={
                  showAdvancedSeo
                    ? "rotate-180 transition"
                    : "transition"
                }
              />

              Advanced SEO settings
            </button>

            {showAdvancedSeo && (
              <div className="grid gap-5 rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4 md:grid-cols-2">
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
                        event
                          .target
                          .value
                      )
                    }
                    rows={3}
                    className="admin-input min-h-[90px] resize-y py-3"
                  />
                </FormField>

                <FormField
                  label="Canonical URL"
                >
                  <input
                    value={
                      values.canonicalUrl ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "canonicalUrl",
                        event
                          .target
                          .value
                      )
                    }
                    className="admin-input"
                    placeholder="https://..."
                  />
                </FormField>

                <ToggleField
                  label="Allow indexing"
                  description="Permit search engines to index this category."
                  checked={
                    values.robotsIndex
                  }
                  onChange={(
                    checked
                  ) =>
                    setField(
                      "robotsIndex",
                      checked
                    )
                  }
                />

                <ToggleField
                  label="Allow link following"
                  description="Permit search engines to follow links from this category."
                  checked={
                    values.robotsFollow
                  }
                  onChange={(
                    checked
                  ) =>
                    setField(
                      "robotsFollow",
                      checked
                    )
                  }
                />
              </div>
            )}
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
            description="Control publication and visibility."
          >
            <ToggleField
              label="Active"
              description="Allow the category to be used by the platform."
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
              label="Show in menu"
              description="Make the category available for navigation menus."
              checked={
                values.showInMenu
              }
              onChange={(
                checked
              ) =>
                setField(
                  "showInMenu",
                  checked
                )
              }
            />

            <ToggleField
              label="Show on homepage"
              description="Allow homepage sections to display this category."
              checked={
                values.showOnHome
              }
              onChange={(
                checked
              ) =>
                setField(
                  "showOnHome",
                  checked
                )
              }
            />

            <ToggleField
              label="Featured"
              description="Highlight the category in featured placements."
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

            <ToggleField
              label="Searchable"
              description="Include the category in catalogue search."
              checked={
                values.isSearchable
              }
              onChange={(
                checked
              ) =>
                setField(
                  "isSearchable",
                  checked
                )
              }
            />
          </FormCard>

          <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">
              Category summary
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow
                label="Parent"
                value={
                  selectedParent
                    ?.name ||
                  "Root category"
                }
              />

              <SummaryRow
                label="Level"
                value={String(
                  selectedParent
                    ? selectedParent.level +
                        1
                    : 0
                )}
              />

              <SummaryRow
                label="Sort order"
                value={String(
                  values.sortOrder
                )}
              />

              <SummaryRow
                label="URL"
                value={`/${
                  values.slug ||
                  generateSlug(
                    values.name
                  ) ||
                  "category"
                }`}
                mono
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
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked
              ? "left-[22px]"
              : "left-0.5",
          ].join(" ")}
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
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function flattenCategories(
  categories:
    Category[]
): Category[] {
  return categories.flatMap(
    (
      category
    ): Category[] => [
      category,

      ...flattenCategories(
        category.children ||
          []
      ),
    ]
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
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
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