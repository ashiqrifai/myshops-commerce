"use client";

import {
  ArrowLeft,
  FilePlus2,
  Globe2,
  Layers3,
  LoaderCircle,
  MonitorSmartphone,
  Plus,
  RefreshCcw,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import AdminShell from "@/components/admin/AdminShell";

import AddSectionModal from "@/components/cms/page-builder/AddSectionModal";

import SortableSectionCard from "@/components/cms/page-builder/SortableSectionCard";

import {
  useGetCmsPageByIdQuery,
} from "@/store/api/cmsPagesApi";

import {
  useChangeCmsPageSectionEnabledMutation,
  useCreateCmsPageSectionMutation,
  useDeleteCmsPageSectionMutation,
  useDuplicateCmsPageSectionMutation,
  useGetCmsPageSectionsQuery,
  useGetCmsSectionTypesQuery,
  useReorderCmsPageSectionsMutation,
} from "@/store/api/cmsPageSectionsApi";

import {
  useAppSelector,
} from "@/store/hooks";

import type {
  CmsPageSection,
  CmsSectionType,
} from "@/types/cms";

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
    apiError.data?.error?.details?.[0]
      ?.message ||
    apiError.data?.error?.message ||
    fallbackMessage
  );
};

export default function CmsPageSectionsPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const pageId = params.id;

  const {
    accessToken,
    initialized,
  } = useAppSelector(
    (state) => state.auth
  );

  const [
    addSectionOpen,
    setAddSectionOpen,
  ] = useState(false);

  const [
    localSections,
    setLocalSections,
  ] = useState<CmsPageSection[]>([]);

  const [
    sectionToDelete,
    setSectionToDelete,
  ] = useState<CmsPageSection | null>(
    null
  );

  useEffect(() => {
    if (
      initialized &&
      !accessToken
    ) {
      router.replace("/login");
    }
  }, [
    accessToken,
    initialized,
    router,
  ]);

  const {
    data: pageResponse,
    isLoading: isLoadingPage,
    error: pageError,
    refetch: refetchPage,
  } = useGetCmsPageByIdQuery(pageId, {
    skip: !accessToken || !pageId,
  });

  const page = pageResponse?.data;

  const {
    data: sectionsResponse,
    isLoading: isLoadingSections,
    isFetching: isFetchingSections,
    error: sectionsError,
    refetch: refetchSections,
  } = useGetCmsPageSectionsQuery(
    pageId,
    {
      skip: !accessToken || !pageId,
    }
  );

  const {
    data: sectionTypesResponse,
    isLoading: isLoadingSectionTypes,
  } = useGetCmsSectionTypesQuery(
    page
      ? {
          channel:
            page.channel === "BOTH"
              ? undefined
              : page.channel,
          isActive: true,
        }
      : undefined,
    {
      skip: !accessToken || !page,
    }
  );

  const [
    createSection,
    { isLoading: isCreating },
  ] = useCreateCmsPageSectionMutation();

  const [
    toggleSectionEnabled,
    { isLoading: isToggling },
  ] =
    useChangeCmsPageSectionEnabledMutation();

  const [
    duplicateSection,
    { isLoading: isDuplicating },
  ] =
    useDuplicateCmsPageSectionMutation();

  const [
    deleteSection,
    { isLoading: isDeleting },
  ] = useDeleteCmsPageSectionMutation();

  const [
    reorderSections,
    { isLoading: isReordering },
  ] =
    useReorderCmsPageSectionsMutation();

  useEffect(() => {
    if (!sectionsResponse?.data) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLocalSections(
        [...sectionsResponse.data].sort(
          (left, right) =>
            left.displayOrder -
            right.displayOrder
        )
      );
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [sectionsResponse]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),

    useSensor(KeyboardSensor, {
      coordinateGetter:
        sortableKeyboardCoordinates,
    })
  );

  const sectionTypes =
    sectionTypesResponse?.data || [];

  const sectionIds = useMemo(
    () =>
      localSections.map(
        (section) => section.id
      ),
    [localSections]
  );

  const actionLoading =
    isCreating ||
    isToggling ||
    isDuplicating ||
    isDeleting ||
    isReordering;

  const handleAddSection = async (
    sectionType: CmsSectionType
  ) => {
    try {
      const response =
        await createSection({
          pageId,
          sectionTypeId:
            sectionType.id,
          name: sectionType.name,
          settings:
            sectionType.defaultSettings ||
            {},
          content:
            sectionType.defaultContent ||
            {},
          visibility: {
            desktop:
              page?.channel !== "KIOSK",
            tablet:
              page?.channel !== "KIOSK",
            mobile:
              page?.channel !== "KIOSK",
            kiosk:
              page?.channel === "KIOSK" ||
              page?.channel === "BOTH",
          },
          isEnabled: true,
        }).unwrap();

      toast.success(
        response.message ||
          `${sectionType.name} added successfully.`
      );

      setAddSectionOpen(false);

      await refetchSections();
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to add section."
        )
      );
    }
  };

  const handleToggleEnabled = async (
    section: CmsPageSection
  ) => {
    try {
      const response =
        await toggleSectionEnabled({
          pageId,
          sectionId: section.id,
          isEnabled:
            !section.isEnabled,
        }).unwrap();

      toast.success(
        response.message ||
          "Section updated successfully."
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

  const handleDuplicate = async (
    section: CmsPageSection
  ) => {
    try {
      const response =
        await duplicateSection({
          pageId,
          sectionId: section.id,
        }).unwrap();

      toast.success(
        response.message ||
          "Section duplicated successfully."
      );
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to duplicate section."
        )
      );
    }
  };

  const handleDeleteConfirmed =
    async () => {
      if (!sectionToDelete) {
        return;
      }

      try {
        const response =
          await deleteSection({
            pageId,
            sectionId:
              sectionToDelete.id,
          }).unwrap();

        toast.success(
          response.message ||
            "Section removed successfully."
        );

        setSectionToDelete(null);
      } catch (error: unknown) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to remove section."
          )
        );
      }
    };

  const handleEditSection = (
    section: CmsPageSection
  ) => {
    router.push(
      `/cms/pages/${pageId}/sections/${section.id}/edit`
    );
  };

  const handleDragEnd = async (
    event: DragEndEvent
  ) => {
    const {
      active,
      over,
    } = event;

    if (
      !over ||
      active.id === over.id
    ) {
      return;
    }

    const oldIndex =
      localSections.findIndex(
        (section) =>
          section.id === active.id
      );

    const newIndex =
      localSections.findIndex(
        (section) =>
          section.id === over.id
      );

    if (
      oldIndex < 0 ||
      newIndex < 0
    ) {
      return;
    }

    const previousSections =
      localSections;

    const reordered = arrayMove(
      localSections,
      oldIndex,
      newIndex
    ).map((section, index) => ({
      ...section,
      displayOrder: index + 1,
    }));

    setLocalSections(reordered);

    try {
      await reorderSections({
        pageId,
        sections: reordered.map(
          (section) => ({
            id: section.id,
            displayOrder:
              section.displayOrder,
          })
        ),
      }).unwrap();

      toast.success(
        "Section order saved."
      );
    } catch (error: unknown) {
      setLocalSections(
        previousSections
      );

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to save section order."
        )
      );
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchPage(),
      refetchSections(),
    ]);

    toast.success(
      "Page builder refreshed."
    );
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  const isLoading =
    isLoadingPage ||
    isLoadingSections;

  const hasError =
    pageError ||
    sectionsError;

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1180px] px-5 py-7 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/cms/pages"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#5c5f62] hover:text-[#202223]"
            >
              <ArrowLeft size={16} />
              Back to pages
            </Link>

            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1f2f3]">
                {page?.channel ===
                "KIOSK" ? (
                  <MonitorSmartphone
                    size={21}
                  />
                ) : (
                  <Globe2 size={21} />
                )}
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {page?.name ||
                    "Page Builder"}
                </h1>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#6d7175]">
                  {page && (
                    <>
                      <span>
                        {page.slug}
                      </span>

                      <span>•</span>

                      <span>
                        {page.channel ===
                        "KIOSK"
                          ? "Android kiosk"
                          : page.channel ===
                              "BOTH"
                            ? "Website and kiosk"
                            : "Website"}
                      </span>

                      <span>•</span>

                      <span>
                        {localSections.length}{" "}
                        section
                        {localSections.length ===
                        1
                          ? ""
                          : "s"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                isFetchingSections ||
                actionLoading
              }
              className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium shadow-sm hover:bg-[#f6f6f7] disabled:opacity-50"
            >
              <RefreshCcw
                size={16}
                className={
                  isFetchingSections
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                setAddSectionOpen(true)
              }
              disabled={
                !page ||
                actionLoading
              }
              className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:opacity-50"
            >
              <Plus size={17} />
              Add section
            </button>
          </div>
        </div>

        {isReordering && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#c9cccf] bg-white px-4 py-3 text-sm text-[#6d7175]">
            <LoaderCircle
              size={15}
              className="animate-spin"
            />

            Saving section order...
          </div>
        )}

        {isLoading && (
          <div className="admin-card flex min-h-[420px] items-center justify-center">
            <div className="text-center">
              <LoaderCircle className="mx-auto animate-spin" />

              <p className="mt-3 text-sm text-[#6d7175]">
                Loading page builder...
              </p>
            </div>
          </div>
        )}

        {!isLoading &&
          hasError && (
            <div className="admin-card p-10 text-center">
              <p className="font-semibold text-red-700">
                Unable to load the page
                builder.
              </p>

              <p className="mt-2 text-sm text-[#6d7175]">
                Check that the backend is
                running and your login is
                still valid.
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                className="mt-5 rounded-lg bg-[#303030] px-4 py-2 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          )}

        {!isLoading &&
          !hasError &&
          page &&
          localSections.length === 0 && (
            <div className="admin-card p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f2f3]">
                <Layers3 size={26} />
              </div>

              <h2 className="mt-5 text-lg font-semibold">
                This page has no sections
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6d7175]">
                Add the first section to begin
                building the page. Sections can
                later be reordered, edited,
                duplicated, enabled or removed.
              </p>

              <button
                type="button"
                onClick={() =>
                  setAddSectionOpen(true)
                }
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
              >
                <FilePlus2 size={17} />
                Add first section
              </button>
            </div>
          )}

        {!isLoading &&
          !hasError &&
          localSections.length > 0 && (
            <div>
              <div className="mb-4 rounded-xl border border-[#dfe3e8] bg-[#f6f6f7] px-4 py-3">
                <p className="text-sm font-medium">
                  Page sections
                </p>

                <p className="mt-1 text-xs text-[#6d7175]">
                  Drag sections using the
                  handle to change their order.
                  Changes are saved
                  automatically.
                </p>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={
                  closestCenter
                }
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sectionIds}
                  strategy={
                    verticalListSortingStrategy
                  }
                >
                  <div className="space-y-3">
                    {localSections.map(
                      (section) => (
                        <SortableSectionCard
                          key={section.id}
                          section={section}
                          actionLoading={
                            actionLoading
                          }
                          onToggleEnabled={
                            handleToggleEnabled
                          }
                          onDuplicate={
                            handleDuplicate
                          }
                          onDelete={
                            setSectionToDelete
                          }
                          onEdit={
                            handleEditSection
                          }
                        />
                      )
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              <button
                type="button"
                onClick={() =>
                  setAddSectionOpen(true)
                }
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#8c9196] bg-white text-sm font-medium text-[#5c5f62] hover:bg-[#f6f6f7]"
              >
                <Plus size={17} />
                Add section
              </button>
            </div>
          )}
      </div>

      {page && (
        <AddSectionModal
          isOpen={addSectionOpen}
          page={page}
          sectionTypes={
            sectionTypes
          }
          isLoading={
            isLoadingSectionTypes
          }
          isCreating={isCreating}
          onClose={() =>
            setAddSectionOpen(false)
          }
          onAdd={handleAddSection}
        />
      )}

      {sectionToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#dfe3e8] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">
              Remove section?
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#6d7175]">
              The section{" "}
              <span className="font-semibold text-[#202223]">
                {sectionToDelete.name}
              </span>{" "}
              will be removed from this page.
              This action cannot be undone from
              the admin screen.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setSectionToDelete(null)
                }
                disabled={isDeleting}
                className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteConfirmed
                }
                disabled={isDeleting}
                className="flex h-10 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
              >
                {isDeleting && (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}

                {isDeleting
                  ? "Removing..."
                  : "Remove section"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}