"use client";

import {
  Bot,
  Boxes,
  Check,
  Globe2,
  Image,
  LayoutGrid,
  LoaderCircle,
  Megaphone,
  MonitorSmartphone,
  PanelTop,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  CmsPage,
  CmsSectionType,
  CmsSectionTypeCategory,
} from "@/types/cms";

interface AddSectionModalProps {
  isOpen: boolean;
  page: CmsPage;
  sectionTypes: CmsSectionType[];
  isLoading: boolean;
  isCreating: boolean;
  onClose: () => void;
  onAdd: (
    sectionType: CmsSectionType
  ) => Promise<void>;
}

const categoryLabels: Record<
  CmsSectionTypeCategory,
  string
> = {
  GLOBAL: "Global",
  HERO: "Hero",
  CATALOG: "Catalogue",
  MARKETING: "Marketing",
  AI: "AI",
  KIOSK: "Kiosk",
};

const categoryOrder: CmsSectionTypeCategory[] = [
  "GLOBAL",
  "HERO",
  "CATALOG",
  "MARKETING",
  "AI",
  "KIOSK",
];

const getSectionIcon = (
  sectionType: CmsSectionType
) => {
  const code = sectionType.code;

  if (
    code.includes("AI") ||
    code.includes("RECOMMEND")
  ) {
    return Bot;
  }

  if (
    code.includes("HERO") ||
    code.includes("BANNER")
  ) {
    return Image;
  }

  if (
    code.includes("PRODUCT") ||
    code.includes("DEALS")
  ) {
    return ShoppingBag;
  }

  if (
    code.includes("CATEGORY") ||
    code.includes("GRID")
  ) {
    return LayoutGrid;
  }

  if (
    code.includes("HEADER") ||
    code.includes("NAVIGATION") ||
    code.includes("FOOTER")
  ) {
    return PanelTop;
  }

  if (
    code.includes("ANNOUNCEMENT") ||
    code.includes("PROMOTION")
  ) {
    return Megaphone;
  }

  if (sectionType.category === "KIOSK") {
    return MonitorSmartphone;
  }

  if (sectionType.category === "AI") {
    return Sparkles;
  }

  return Boxes;
};

export default function AddSectionModal({
  isOpen,
  page,
  sectionTypes,
  isLoading,
  isCreating,
  onClose,
  onAdd,
}: AddSectionModalProps) {
  const [search, setSearch] = useState("");
  const [
    selectedSectionTypeId,
    setSelectedSectionTypeId,
  ] = useState<string | null>(null);

  const compatibleSectionTypes =
    useMemo(() => {
      const searchValue =
        search.trim().toLowerCase();

      return sectionTypes.filter(
        (sectionType) => {
          const supportsPage =
            page.channel === "BOTH"
              ? sectionType.supportedChannels.some(
                  (channel) =>
                    channel === "WEBSITE" ||
                    channel === "KIOSK"
                )
              : sectionType.supportedChannels.includes(
                  page.channel
                );

          if (!supportsPage) {
            return false;
          }

          if (!searchValue) {
            return true;
          }

          return [
            sectionType.name,
            sectionType.code,
            sectionType.description || "",
            sectionType.category,
          ].some((value) =>
            value
              .toLowerCase()
              .includes(searchValue)
          );
        }
      );
    }, [
      page.channel,
      search,
      sectionTypes,
    ]);

  const groupedSectionTypes =
    useMemo(() => {
      return categoryOrder
        .map((category) => ({
          category,
          sectionTypes:
            compatibleSectionTypes.filter(
              (sectionType) =>
                sectionType.category ===
                category
            ),
        }))
        .filter(
          (group) =>
            group.sectionTypes.length > 0
        );
    }, [compatibleSectionTypes]);

  const selectedSectionType =
    sectionTypes.find(
      (sectionType) =>
        sectionType.id ===
        selectedSectionTypeId
    );

  const handleClose = () => {
    if (isCreating) {
      return;
    }

    setSearch("");
    setSelectedSectionTypeId(null);
    onClose();
  };

  const handleAdd = async () => {
    if (!selectedSectionType) {
      return;
    }

    await onAdd(selectedSectionType);

    setSearch("");
    setSelectedSectionTypeId(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#e1e3e5] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">
              Add section
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Choose a reusable section for{" "}
              <span className="font-medium text-[#202223]">
                {page.name}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5c5f62] hover:bg-[#f1f2f3] disabled:opacity-50"
            aria-label="Close add section window"
          >
            <X size={19} />
          </button>
        </div>

        <div className="border-b border-[#e1e3e5] px-6 py-4">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="admin-input pl-10"
              placeholder="Search section types"
              autoFocus
            />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-[#6d7175]">
            {page.channel === "KIOSK" ? (
              <MonitorSmartphone size={14} />
            ) : (
              <Globe2 size={14} />
            )}

            Compatible with{" "}
            {page.channel === "KIOSK"
              ? "Android kiosk"
              : page.channel === "BOTH"
                ? "website and kiosk"
                : "website"}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto animate-spin" />

                <p className="mt-3 text-sm text-[#6d7175]">
                  Loading section types...
                </p>
              </div>
            </div>
          )}

          {!isLoading &&
            groupedSectionTypes.length === 0 && (
              <div className="py-12 text-center">
                <Search
                  size={32}
                  className="mx-auto text-[#8c9196]"
                />

                <h3 className="mt-4 font-semibold">
                  No sections found
                </h3>

                <p className="mt-2 text-sm text-[#6d7175]">
                  Try another search term.
                </p>
              </div>
            )}

          {!isLoading && (
            <div className="space-y-7">
              {groupedSectionTypes.map(
                (group) => (
                  <section
                    key={group.category}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7175]">
                        {
                          categoryLabels[
                            group.category
                          ]
                        }
                      </h3>

                      <span className="text-xs text-[#8c9196]">
                        {
                          group.sectionTypes
                            .length
                        }
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {group.sectionTypes.map(
                        (sectionType) => {
                          const Icon =
                            getSectionIcon(
                              sectionType
                            );

                          const selected =
                            selectedSectionTypeId ===
                            sectionType.id;

                          return (
                            <button
                              key={
                                sectionType.id
                              }
                              type="button"
                              onClick={() =>
                                setSelectedSectionTypeId(
                                  sectionType.id
                                )
                              }
                              className={[
                                "relative flex min-h-[112px] items-start gap-4 rounded-xl border p-4 text-left transition",
                                selected
                                  ? "border-[#303030] bg-[#f6f6f7] shadow-sm"
                                  : "border-[#e1e3e5] hover:border-[#babfc3] hover:bg-[#fafafa]",
                              ].join(" ")}
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                                <Icon size={19} />
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-semibold">
                                  {
                                    sectionType.name
                                  }
                                </p>

                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6d7175]">
                                  {sectionType.description ||
                                    "Reusable CMS section."}
                                </p>

                                <p className="mt-2 font-mono text-[10px] text-[#8c9196]">
                                  {
                                    sectionType.code
                                  }
                                </p>
                              </div>

                              {selected && (
                                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#303030] text-white">
                                  <Check size={14} />
                                </div>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </section>
                )
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#e1e3e5] bg-[#fafafa] px-6 py-4">
          <p className="text-sm text-[#6d7175]">
            {selectedSectionType
              ? `${selectedSectionType.name} selected`
              : "Select a section type"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium shadow-sm hover:bg-[#f6f6f7] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAdd}
              disabled={
                !selectedSectionType ||
                isCreating
              }
              className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Plus size={16} />
              )}

              {isCreating
                ? "Adding..."
                : "Add section"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}