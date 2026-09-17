"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  ArrowLeft,
  Globe2,
  LoaderCircle,
  MonitorSmartphone,
  Save,
  Send,
  Undo2,
} from "lucide-react";

import Link from "next/link";

import type {
  CmsPage,
  CmsPageChannel,
  CmsPageFormValues,
  CmsPageType,
} from "@/types/cms";

interface CmsPageFormProps {
  page?: CmsPage;

  isSaving: boolean;

  isChangingStatus?: boolean;

  submitLabel: string;

  onSubmit: (
    values: CmsPageFormValues
  ) => Promise<void>;

  onStatusChange?: () =>
    Promise<void> | void;
}

const pageTypes: Array<{
  value: CmsPageType;
  label: string;
}> = [
  {
    value: "HOME",
    label: "Home",
  },
  {
    value: "CATEGORY",
    label: "Category",
  },
  {
    value: "BRAND",
    label: "Brand",
  },
  {
    value: "PRODUCT",
    label: "Product",
  },
  {
    value: "SEARCH",
    label: "Search",
  },
  {
    value: "CART",
    label: "Cart",
  },
  {
    value: "CHECKOUT",
    label: "Checkout",
  },
  {
    value: "OFFERS",
    label: "Offers",
  },
  {
    value: "LANDING",
    label: "Landing Page",
  },
  {
    value: "CUSTOM",
    label: "Custom Page",
  },
];

const toDateTimeLocal = (
  value?: string | null
): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 16);
};

export default function CmsPageForm({
  page,
  isSaving,
  isChangingStatus = false,
  submitLabel,
  onSubmit,
  onStatusChange,
}: CmsPageFormProps) {
  const [name, setName] = useState(
    page?.name || ""
  );

  const [code, setCode] = useState(
    page?.code || ""
  );

  const [slug, setSlug] = useState(
    page?.slug || ""
  );

  const [pageType, setPageType] =
    useState<CmsPageType>(
      page?.pageType || "CUSTOM"
    );

  const [channel, setChannel] =
    useState<CmsPageChannel>(
      page?.channel || "WEBSITE"
    );

  const [title, setTitle] = useState(
    page?.title || ""
  );

  const [
    description,
    setDescription,
  ] = useState(
    page?.description || ""
  );

  const [seoTitle, setSeoTitle] =
    useState(
      page?.seoTitle || ""
    );

  const [
    seoDescription,
    setSeoDescription,
  ] = useState(
    page?.seoDescription || ""
  );

  const [
    seoKeywordsText,
    setSeoKeywordsText,
  ] = useState(
    (page?.seoKeywords || []).join(", ")
  );

  const [
    publishStartAt,
    setPublishStartAt,
  ] = useState(
    toDateTimeLocal(
      page?.publishStartAt
    )
  );

  const [
    publishEndAt,
    setPublishEndAt,
  ] = useState(
    toDateTimeLocal(
      page?.publishEndAt
    )
  );

  const [
    isDefault,
    setIsDefault,
  ] = useState(
    page?.isDefault || false
  );

  const handleNameChange = (
    value: string
  ) => {
    setName(value);

    if (!page) {
      const generatedCode = value
        .trim()
        .toUpperCase()
        .replace(
          /[^A-Z0-9]+/g,
          "_"
        )
        .replace(
          /^_+|_+$/g,
          ""
        );

      setCode(generatedCode);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const seoKeywords =
      seoKeywordsText
        .split(",")
        .map((value) =>
          value.trim()
        )
        .filter(Boolean);

    await onSubmit({
      name: name.trim(),
      code: code.trim(),
      slug: slug.trim(),
      pageType,
      channel,
      title: title.trim(),
      description:
        description.trim(),
      seoTitle:
        seoTitle.trim(),
      seoDescription:
        seoDescription.trim(),
      seoKeywords,
      layoutSettings:
        page?.layoutSettings || {},
      publishStartAt:
        publishStartAt
          ? new Date(
              publishStartAt
            ).toISOString()
          : null,
      publishEndAt:
        publishEndAt
          ? new Date(
              publishEndAt
            ).toISOString()
          : null,
      isDefault,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-[1100px] px-5 py-7 lg:px-8"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/cms/pages"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#5c5f62] hover:text-[#202223]"
          >
            <ArrowLeft size={16} />
            Back to pages
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight">
            {page
              ? `Edit ${page.name}`
              : "Create page"}
          </h1>

          <p className="mt-1 text-sm text-[#6d7175]">
            Configure the page for the
            Next.js website or Android kiosk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {page ? (
            <span
              className={[
                "inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold",
                page.status === "PUBLISHED"
                  ? "bg-[#e3f1df] text-[#276749]"
                  : page.status === "UNPUBLISHED"
                    ? "bg-[#fff4d6] text-[#7a5a00]"
                    : page.status === "ARCHIVED"
                      ? "bg-[#f1f2f3] text-[#5c5f62]"
                      : "bg-[#e4e5e7] text-[#5c5f62]",
              ].join(" ")}
            >
              {page.status === "PUBLISHED"
                ? "Published"
                : page.status === "UNPUBLISHED"
                  ? "Unpublished"
                  : page.status === "ARCHIVED"
                    ? "Archived"
                    : "Draft"}
            </span>
          ) : null}

          <button
            type="submit"
            disabled={isSaving || isChangingStatus}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {isSaving ? "Saving..." : submitLabel}
          </button>

          {page && onStatusChange && page.status !== "ARCHIVED" ? (
            <button
              type="button"
              onClick={() => void onStatusChange()}
              disabled={isSaving || isChangingStatus}
              className={[
                "flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50",
                page.status === "PUBLISHED"
                  ? "border border-[#babfc3] bg-white text-[#202223] hover:bg-[#f6f6f7]"
                  : "bg-[#008060] text-white hover:bg-[#006e52]",
              ].join(" ")}
            >
              {isChangingStatus ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : page.status === "PUBLISHED" ? (
                <Undo2 size={17} />
              ) : (
                <Send size={17} />
              )}

              {isChangingStatus
                ? "Updating..."
                : page.status === "PUBLISHED"
                  ? "Unpublish"
                  : "Publish"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          <section className="admin-card p-6">
            <h2 className="text-base font-semibold">
              Page details
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Basic information used to identify
              and route this page.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="page-name"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Page name
                </label>

                <input
                  id="page-name"
                  value={name}
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  placeholder="Summer Offers"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="page-code"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Page code
                </label>

                <input
                  id="page-code"
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                    )
                  }
                  className="admin-input uppercase"
                  placeholder="SUMMER_OFFERS"
                  required
                />

                <p className="mt-1 text-xs text-[#6d7175]">
                  Internal unique identifier.
                </p>
              </div>

              <div>
                <label
                  htmlFor="page-slug"
                  className="mb-1.5 block text-sm font-medium"
                >
                  URL slug
                </label>

                <input
                  id="page-slug"
                  value={slug}
                  onChange={(event) =>
                    setSlug(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  placeholder="/summer-offers"
                  required
                />

                <p className="mt-1 text-xs text-[#6d7175]">
                  Use / for the home page.
                </p>
              </div>

              <div>
                <label
                  htmlFor="page-type"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Page type
                </label>

                <select
                  id="page-type"
                  value={pageType}
                  onChange={(event) =>
                    setPageType(
                      event.target
                        .value as CmsPageType
                    )
                  }
                  className="admin-input"
                >
                  {pageTypes.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="browser-title"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Browser title
                </label>

                <input
                  id="browser-title"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  placeholder="Summer Electronics Offers"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="page-description"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="page-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  className="admin-input min-h-[110px] resize-y"
                  placeholder="Describe the purpose of this page."
                />
              </div>
            </div>
          </section>

          <section className="admin-card p-6">
            <h2 className="text-base font-semibold">
              Search engine listing
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              SEO information for the public
              Next.js website.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="seo-title"
                  className="mb-1.5 block text-sm font-medium"
                >
                  SEO title
                </label>

                <input
                  id="seo-title"
                  value={seoTitle}
                  onChange={(event) =>
                    setSeoTitle(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  maxLength={250}
                />
              </div>

              <div>
                <label
                  htmlFor="seo-description"
                  className="mb-1.5 block text-sm font-medium"
                >
                  SEO description
                </label>

                <textarea
                  id="seo-description"
                  value={seoDescription}
                  onChange={(event) =>
                    setSeoDescription(
                      event.target.value
                    )
                  }
                  className="admin-input min-h-[100px] resize-y"
                />
              </div>

              <div>
                <label
                  htmlFor="seo-keywords"
                  className="mb-1.5 block text-sm font-medium"
                >
                  SEO keywords
                </label>

                <input
                  id="seo-keywords"
                  value={seoKeywordsText}
                  onChange={(event) =>
                    setSeoKeywordsText(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  placeholder="electronics, offers, laptops"
                />

                <p className="mt-1 text-xs text-[#6d7175]">
                  Separate keywords with commas.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="admin-card p-5">
            <h2 className="text-sm font-semibold">
              Channel
            </h2>

            <p className="mt-1 text-xs text-[#6d7175]">
              Choose where this page is used.
            </p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() =>
                  setChannel("WEBSITE")
                }
                className={[
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
                  channel === "WEBSITE"
                    ? "border-[#303030] bg-[#f6f6f7]"
                    : "border-[#e1e3e5] hover:bg-[#fafafa]",
                ].join(" ")}
              >
                <Globe2 size={19} />

                <div>
                  <p className="text-sm font-medium">
                    Website
                  </p>

                  <p className="text-xs text-[#6d7175]">
                    Next.js customer website
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setChannel("KIOSK")
                }
                className={[
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
                  channel === "KIOSK"
                    ? "border-[#303030] bg-[#f6f6f7]"
                    : "border-[#e1e3e5] hover:bg-[#fafafa]",
                ].join(" ")}
              >
                <MonitorSmartphone size={19} />

                <div>
                  <p className="text-sm font-medium">
                    Android kiosk
                  </p>

                  <p className="text-xs text-[#6d7175]">
                    Native Jetpack Compose kiosk
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setChannel("BOTH")
                }
                className={[
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
                  channel === "BOTH"
                    ? "border-[#303030] bg-[#f6f6f7]"
                    : "border-[#e1e3e5] hover:bg-[#fafafa]",
                ].join(" ")}
              >
                <div className="flex gap-1">
                  <Globe2 size={17} />
                  <MonitorSmartphone
                    size={17}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium">
                    Both
                  </p>

                  <p className="text-xs text-[#6d7175]">
                    Website and kiosk
                  </p>
                </div>
              </button>
            </div>
          </section>

          <section className="admin-card p-5">
            <h2 className="text-sm font-semibold">
              Publishing schedule
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="publish-start"
                  className="mb-1.5 block text-xs font-medium"
                >
                  Publish start
                </label>

                <input
                  id="publish-start"
                  type="datetime-local"
                  value={publishStartAt}
                  onChange={(event) =>
                    setPublishStartAt(
                      event.target.value
                    )
                  }
                  className="admin-input"
                />
              </div>

              <div>
                <label
                  htmlFor="publish-end"
                  className="mb-1.5 block text-xs font-medium"
                >
                  Publish end
                </label>

                <input
                  id="publish-end"
                  type="datetime-local"
                  value={publishEndAt}
                  onChange={(event) =>
                    setPublishEndAt(
                      event.target.value
                    )
                  }
                  className="admin-input"
                />
              </div>
            </div>
          </section>

          <section className="admin-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">
                  Default page
                </h2>

                <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                  Use this as the default page for
                  the selected channel.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsDefault(
                    (current) =>
                      !current
                  )
                }
                className={[
                  "relative h-6 w-11 rounded-full transition",
                  isDefault
                    ? "bg-[#303030]"
                    : "bg-[#c9cccf]",
                ].join(" ")}
                aria-pressed={isDefault}
                aria-label="Set as default page"
              >
                <span
                  className={[
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                    isDefault
                      ? "left-[22px]"
                      : "left-0.5",
                  ].join(" ")}
                />
              </button>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}