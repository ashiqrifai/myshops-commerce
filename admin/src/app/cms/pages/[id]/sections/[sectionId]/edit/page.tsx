"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  LoaderCircle,
  Save,
} from "lucide-react";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { toast } from "sonner";

import AdminShell from "@/components/admin/AdminShell";

import DynamicObjectEditor from "@/components/cms/page-builder/editor/DynamicObjectEditor";

import NavigationEditor from "@/components/cms/page-builder/editor/NavigationEditor";

import HeroCarouselEditor from "@/components/cms/page-builder/editor/HeroCarouselEditor";

import SectionVisibilityEditor from "@/components/cms/page-builder/editor/SectionVisibilityEditor";

import CategoryGridEditor from "@/components/cms/page-builder/editor/CategoryGridEditor";

import FeaturedProductGridEditor from "@/components/cms/page-builder/editor/FeaturedProductGridEditor";

import BrandCarouselEditor from "@/components/cms/page-builder/editor/BrandCarouselEditor";

import ProductCarouselEditor from "@/components/cms/page-builder/editor/ProductCarouselEditor";

import FlashDealsEditor from "@/components/cms/page-builder/editor/FlashDealsEditor";

import PromotionBannerGridEditor from "@/components/cms/page-builder/editor/PromotionBannerGridEditor";

import PreBookingEditor from "@/components/cms/page-builder/editor/PreBookingEditor";

import CollectionGridEditor from "@/components/cms/page-builder/editor/CollectionGridEditor";

import {
  useGetCmsPageSectionByIdQuery,
  useUpdateCmsPageSectionMutation,
} from "@/store/api/cmsPageSectionsApi";

import type {
  CmsPageSection,
  CmsSectionVisibility,
} from "@/types/cms";

const toDateTimeLocal = (
  value?: string | null
): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset() *
    60000;

  return new Date(
    date.getTime() - offset
  )
    .toISOString()
    .slice(0, 16);
};

const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  const apiError = error as {
    data?: {
      error?: {
        message?: string;

        details?: Array<{
          message?: string;
        }>;
      };
    };
  };

  return (
    apiError.data?.error
      ?.details?.[0]
      ?.message ||
    apiError.data?.error
      ?.message ||
    fallbackMessage
  );
};

interface SectionEditorFormProps {
  section: CmsPageSection;
  pageId: string;
}

const mergeSectionValues = (
  defaults?:
    | Record<string, unknown>
    | null,

  savedValues?:
    | Record<string, unknown>
    | null
): Record<string, unknown> => {
  return {
    ...(defaults || {}),
    ...(savedValues || {}),
  };
};



const SectionEditorForm = ({
  section,
  pageId,
}: SectionEditorFormProps) => {
  const router = useRouter();

  const [
    updateSection,
    {
      isLoading: isSaving,
    },
  ] =
    useUpdateCmsPageSectionMutation();

  const [name, setName] =
    useState(section.name);

  const [code, setCode] =
    useState(section.code);

  const [settings, setSettings] =
    useState<
      Record<string, unknown>
    >(() =>
      mergeSectionValues(
        section.sectionType
          .defaultSettings,
        section.settings
      )
    );

  const [content, setContent] =
    useState<
      Record<string, unknown>
    >(() =>
      mergeSectionValues(
        section.sectionType
          .defaultContent,
        section.content
      )
    );

  const [
    visibility,
    setVisibility,
  ] =
    useState<CmsSectionVisibility>({
      desktop:
        section.visibility
          ?.desktop ?? true,

      tablet:
        section.visibility
          ?.tablet ?? true,

      mobile:
        section.visibility
          ?.mobile ?? true,

      kiosk:
        section.visibility
          ?.kiosk ?? false,
    });

  const [
    publishStartAt,
    setPublishStartAt,
  ] = useState(
    toDateTimeLocal(
      section.publishStartAt
    )
  );

  const [
    publishEndAt,
    setPublishEndAt,
  ] = useState(
    toDateTimeLocal(
      section.publishEndAt
    )
  );

  const [
    isEnabled,
    setIsEnabled,
  ] = useState(
    section.isEnabled
  );

  const sectionTypeCode =
    section.sectionType.code
      .trim()
      .toUpperCase();

      const isHeroCarousel =
      sectionTypeCode ===
      "HERO_CAROUSEL";
    
    const isNavigation =
      sectionTypeCode ===
      "NAVIGATION";
    
    const isCategoryGrid =
      sectionTypeCode ===
      "CATEGORY_GRID";

    const isFeaturedProductGrid =
      sectionTypeCode ===
      "FEATURED_PRODUCT_GRID";
    
    const isBrandCarousel =
      sectionTypeCode ===
      "BRAND_CAROUSEL";

    const isProductCarousel =
      sectionTypeCode ===
      "PRODUCT_CAROUSEL";
    
    const isFlashDeals =
      sectionTypeCode ===
      "FLASH_DEALS";

    const isPromotionBannerGrid =
      sectionTypeCode ===
      "PROMOTION_BANNER_GRID";
    
    const isCollectionGrid =
      sectionTypeCode ===
      "COLLECTION_GRID";
        
    
    const isPreBooking = sectionTypeCode === "PRE_BOOKING";


  const validateHeroCarousel =
    (): boolean => {
      if (!isHeroCarousel) {
        return true;
      }

      const slides =
        Array.isArray(
          content.slides
        )
          ? content.slides
          : [];

      if (slides.length === 0) {
        toast.error(
          "Add at least one hero slide."
        );

        return false;
      }

      for (
        let index = 0;
        index < slides.length;
        index += 1
      ) {
        const slide =
          slides[index];

        if (
          !slide ||
          typeof slide !==
            "object" ||
          Array.isArray(slide)
        ) {
          toast.error(
            `Slide ${
              index + 1
            } is invalid.`
          );

          return false;
        }

        const slideObject =
          slide as Record<
            string,
            unknown
          >;

        if (
          !slideObject
            .desktopAssetId
        ) {
          toast.error(
            `Desktop image is required for slide ${
              index + 1
            }.`
          );

          return false;
        }

        const buttonLabel =
          typeof slideObject
            .buttonLabel ===
          "string"
            ? slideObject
                .buttonLabel
                .trim()
            : "";

        const buttonUrl =
          typeof slideObject
            .buttonUrl ===
          "string"
            ? slideObject
                .buttonUrl
                .trim()
            : "";

        if (
          Boolean(buttonLabel) !==
          Boolean(buttonUrl)
        ) {
          toast.error(
            `Primary button label and URL must both be completed for slide ${
              index + 1
            }.`
          );

          return false;
        }

        const secondaryLabel =
          typeof slideObject
            .secondaryButtonLabel ===
          "string"
            ? slideObject
                .secondaryButtonLabel
                .trim()
            : "";

        const secondaryUrl =
          typeof slideObject
            .secondaryButtonUrl ===
          "string"
            ? slideObject
                .secondaryButtonUrl
                .trim()
            : "";

        if (
          Boolean(
            secondaryLabel
          ) !==
          Boolean(secondaryUrl)
        ) {
          toast.error(
            `Secondary button label and URL must both be completed for slide ${
              index + 1
            }.`
          );

          return false;
        }
      }

      return true;
    };

    const validateCategoryGrid =
  (): boolean => {
    if (!isCategoryGrid) {
      return true;
    }

    const sourceType =
      typeof settings.sourceType ===
      "string"
        ? settings.sourceType
            .trim()
            .toUpperCase()
        : "MANUAL";

    if (sourceType !== "MANUAL") {
      return true;
    }

    const categoryIds =
      Array.isArray(
        content.categoryIds
      )
        ? content.categoryIds.filter(
            (
              categoryId
            ): categoryId is string =>
              typeof categoryId ===
                "string" &&
              Boolean(
                categoryId.trim()
              )
          )
        : [];

    if (
      categoryIds.length === 0
    ) {
      toast.error(
        "Select at least one category."
      );

      return false;
    }

    return true;
  };


  const validateCollectionGrid =
  (): boolean => {
    if (
      !isCollectionGrid
    ) {
      return true;
    }

    const sourceType =
      typeof settings.sourceType ===
      "string"
        ? settings.sourceType
            .trim()
            .toUpperCase()
        : "MANUAL";

    if (
      sourceType !==
      "MANUAL"
    ) {
      return true;
    }

    const collectionIds =
      Array.isArray(
        content.collectionIds
      )
        ? content.collectionIds.filter(
            (
              collectionId
            ): collectionId is string =>
              typeof collectionId ===
                "string" &&
              Boolean(
                collectionId.trim()
              )
          )
        : [];

    if (
      collectionIds.length ===
      0
    ) {
      toast.error(
        "Select at least one collection."
      );

      return false;
    }

    return true;
  };

  const validatePromotionBannerGrid =
    (): boolean => {
      if (!isPromotionBannerGrid) {
        return true;
      }

      const items =
        Array.isArray(content.items)
          ? content.items
          : [];

      if (items.length === 0) {
        toast.error(
          "Add at least one promotional banner."
        );

        return false;
      }

      for (
        let index = 0;
        index < items.length;
        index += 1
      ) {
        const item =
          items[index];

        if (
          !item ||
          typeof item !== "object" ||
          Array.isArray(item)
        ) {
          toast.error(
            `Banner ${index + 1} is invalid.`
          );

          return false;
        }

        const banner =
          item as Record<
            string,
            unknown
          >;

        if (
          !banner.desktopAssetId &&
          !banner.tabletAssetId &&
          !banner.mobileAssetId
        ) {
          toast.error(
            `Select at least one image for banner ${index + 1}.`
          );

          return false;
        }

        const desktopSpan =
          Number(
            banner.desktopSpan
          );

        const tabletSpan =
          Number(
            banner.tabletSpan
          );

        const mobileSpan =
          Number(
            banner.mobileSpan
          );

        if (
          !Number.isFinite(
            desktopSpan
          ) ||
          desktopSpan < 1 ||
          desktopSpan > 12
        ) {
          toast.error(
            `Desktop span for banner ${index + 1} must be between 1 and 12.`
          );

          return false;
        }

        if (
          !Number.isFinite(
            tabletSpan
          ) ||
          tabletSpan < 1 ||
          tabletSpan > 6
        ) {
          toast.error(
            `Tablet span for banner ${index + 1} must be between 1 and 6.`
          );

          return false;
        }

        if (
          !Number.isFinite(
            mobileSpan
          ) ||
          mobileSpan < 1 ||
          mobileSpan > 2
        ) {
          toast.error(
            `Mobile span for banner ${index + 1} must be between 1 and 2.`
          );

          return false;
        }
      }

      return true;
    };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error(
        "Section name is required."
      );

      return;
    }

    if (!code.trim()) {
      toast.error(
        "Section code is required."
      );

      return;
    }

    if (
      publishStartAt &&
      publishEndAt &&
      new Date(
        publishEndAt
      ) <=
        new Date(
          publishStartAt
        )
    ) {
      toast.error(
        "Publish end must be later than publish start."
      );

      return;
    }

    if (
      !validateHeroCarousel()
    ) {
      return;
    }

    if (!validateCategoryGrid()) {
      return;
    }

    if (
      !validateCollectionGrid()
    ) {
      return;
    }

    if (
      !validatePromotionBannerGrid()
    ) {
      return;
    }

    try {
      const response =
        await updateSection({
          pageId,

          sectionId:
            section.id,

          body: {
            name:
              name.trim(),

            code:
              code
                .trim()
                .toUpperCase(),

            settings,
            content,
            visibility,

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

            isEnabled,
          },
        }).unwrap();

      toast.success(
        response.message ||
          "Section updated successfully."
      );

      router.push(
        `/cms/pages/${pageId}/sections`
      );
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to update section."
        )
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-[1180px] px-5 py-7 lg:px-8"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/cms/pages/${pageId}/sections`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5c5f62] hover:text-[#202223]"
          >
            <ArrowLeft
              size={16}
            />

            Back to page builder
          </Link>

          <div className="mt-4">
            <p className="text-sm text-[#6d7175]">
              {
                section
                  .sectionType
                  .category
              }{" "}
              section
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Edit {section.name}
            </h1>

            <p className="mt-1 text-sm text-[#6d7175]">
              {
                section
                  .sectionType
                  .description
              }
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <Save size={17} />
          )}

          {isSaving
            ? "Saving..."
            : "Save section"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          <section className="admin-card p-6">
            <div className="flex items-center gap-2">
              <Code2 size={17} />

              <h2 className="text-base font-semibold">
                Section identity
              </h2>
            </div>

            <p className="mt-1 text-sm text-[#6d7175]">
              Internal name and unique
              code for this page section.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="section-name"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Section name
                </label>

                <input
                  id="section-name"
                  value={name}
                  onChange={(
                    event
                  ) =>
                    setName(
                      event.target
                        .value
                    )
                  }
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="section-code"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Section code
                </label>

                <input
                  id="section-code"
                  value={code}
                  onChange={(
                    event
                  ) =>
                    setCode(
                      event.target
                        .value
                    )
                  }
                  className="admin-input font-mono uppercase"
                  required
                />
              </div>
            </div>
          </section>

          <DynamicObjectEditor
            title="Section settings"
            description="Control layout, behaviour, appearance and rendering options."
            value={settings}
            onChange={
              setSettings
            }
          />

{isHeroCarousel ? (
  <HeroCarouselEditor
    value={content}
    onChange={setContent}
  />
) : isNavigation ? (
  <NavigationEditor
    value={content}
    onChange={setContent}
  />
) : isCategoryGrid ? (
  <CategoryGridEditor
    value={content}
    settings={settings}
    onChange={setContent}
  />
) : isCollectionGrid ? (
  <CollectionGridEditor
    value={content}
    settings={settings}
    onChange={setContent}
  />
) : isFeaturedProductGrid ? (
  <FeaturedProductGridEditor
    value={content}
    onChange={setContent}
  />

) : isBrandCarousel ? (
  <BrandCarouselEditor
    value={content}
    onChange={setContent}
  />
) : isProductCarousel ? (
  <ProductCarouselEditor
    value={content}
    settings={settings}
    onChange={setContent}
  />
) : isFlashDeals ? (
  <FlashDealsEditor
    value={content}
    settings={settings}
    onChange={setContent}
    onSettingsChange={setSettings}
  />
) : isPromotionBannerGrid ? (
  <PromotionBannerGridEditor
    value={content}
    settings={settings}
    onChange={setContent}
    onSettingsChange={setSettings}
  />

) : isPreBooking ? (
  <PreBookingEditor
    value={content}
    settings={settings}
    onChange={setContent}
    onSettingsChange={setSettings}
  />
) : (

  <DynamicObjectEditor
    title="Section content"
    description="Manage text, media references, selected records and content displayed by this section."
    value={content}
    onChange={setContent}
  />
)}
        </div>

        <div className="space-y-5">
          <section className="admin-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                  />

                  <h2 className="text-sm font-semibold">
                    Section status
                  </h2>
                </div>

                <p className="mt-2 text-xs leading-5 text-[#6d7175]">
                  Disabled sections
                  remain in the builder
                  but are not rendered
                  publicly.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsEnabled(
                    (current) =>
                      !current
                  )
                }
                className={[
                  "relative h-6 w-11 shrink-0 rounded-full transition",

                  isEnabled
                    ? "bg-[#303030]"
                    : "bg-[#c9cccf]",
                ].join(" ")}
                aria-pressed={
                  isEnabled
                }
              >
                <span
                  className={[
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",

                    isEnabled
                      ? "left-[22px]"
                      : "left-0.5",
                  ].join(" ")}
                />
              </button>
            </div>

            <div
              className={[
                "mt-4 rounded-lg px-3 py-2 text-xs font-medium",

                isEnabled
                  ? "bg-[#e3f1df] text-[#276749]"
                  : "bg-[#fbeae5] text-[#a23b2a]",
              ].join(" ")}
            >
              {isEnabled
                ? "This section is enabled."
                : "This section is disabled."}
            </div>
          </section>

          <SectionVisibilityEditor
            visibility={
              visibility
            }
            publishStartAt={
              publishStartAt
            }
            publishEndAt={
              publishEndAt
            }
            onVisibilityChange={
              setVisibility
            }
            onPublishStartChange={
              setPublishStartAt
            }
            onPublishEndChange={
              setPublishEndAt
            }
          />

          <section className="admin-card p-5">
            <h2 className="text-sm font-semibold">
              Section type
            </h2>

            <p className="mt-1 text-xs text-[#6d7175]">
              The section type cannot
              be changed after creation.
            </p>

            <div className="mt-4 rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4">
              <p className="text-sm font-semibold">
                {
                  section
                    .sectionType
                    .name
                }
              </p>

              <p className="mt-1 font-mono text-xs text-[#6d7175]">
                {
                  section
                    .sectionType
                    .code
                }
              </p>

              <p className="mt-3 text-xs leading-5 text-[#6d7175]">
                {
                  section
                    .sectionType
                    .description
                }
              </p>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
};

export default function EditCmsPageSectionPage() {
  const params = useParams<{
    id: string;
    sectionId: string;
  }>();

  const pageId = params.id;

  const sectionId =
    params.sectionId;

  const {
    data,
    isLoading,
    error,
  } =
    useGetCmsPageSectionByIdQuery({
      pageId,
      sectionId,
    });

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex min-h-[500px] items-center justify-center">
          <LoaderCircle className="animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (
    error ||
    !data?.data
  ) {
    return (
      <AdminShell>
        <div className="mx-auto max-w-[900px] px-5 py-10">
          <Link
            href={`/cms/pages/${pageId}/sections`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5c5f62]"
          >
            <ArrowLeft
              size={16}
            />

            Back to page builder
          </Link>

          <div className="admin-card mt-6 p-8 text-center">
            <h1 className="text-lg font-semibold">
              Section not found
            </h1>

            <p className="mt-2 text-sm text-[#6d7175]">
              The requested CMS
              section could not be
              loaded.
            </p>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <SectionEditorForm
        key={`${data.data.id}-${data.data.updatedAt}`}
        section={data.data}
        pageId={pageId}
      />
    </AdminShell>
  );
}