"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FileText,
  ImageIcon,
  LoaderCircle,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  toast,
} from "sonner";

import MediaAssetPicker from "@/components/media/MediaAssetPicker";
import NavigationRulesEditor from "./NavigationRulesEditor";
import NavigationPromotionEditor from "./NavigationPromotionEditor";

import {
  defaultNavigationPromotionSettings,
} from "./navigationPromotion";


import NavigationEntityPicker, {
  isNavigationEntityType,
  type NavigationEntitySelection,
} from "./NavigationEntityPicker";

import type {
  MediaAsset,
} from "@/types/media";

import type {
  NavigationItem,
  NavigationItemFormValues,
  NavigationItemType,
} from "@/types/navigation";

interface NavigationItemModalProps {
  isOpen: boolean;

  item?:
    NavigationItem | null;

  parentItem?:
    NavigationItem | null;

  maxColumns: number;

  isSaving: boolean;

  onClose: () => void;

  onSubmit: (
    values:
      NavigationItemFormValues
  ) => Promise<void>;
}

const itemTypes: Array<{
  value: NavigationItemType;
  label: string;
}> = [
  {
    value:
      "CUSTOM_LINK",

    label:
      "Custom link",
  },
  {
    value:
      "CATEGORY",

    label:
      "Category",
  },
  {
    value:
      "BRAND",

    label:
      "Brand",
  },
  {
    value:
      "PRODUCT",

    label:
      "Product",
  },
  {
    value: "COLLECTION",

    label: "Collection",
  },
  {
    value:
      "CMS_PAGE",

    label:
      "CMS page",
  },
  {
    value:
      "DROPDOWN",

    label:
      "Dropdown",
  },
  {
    value:
      "MEGA_MENU",

    label:
      "Mega menu",
  },
  {
    value:
      "HEADING",

    label:
      "Heading",
  },
  {
    value:
      "PROMOTION",

    label:
      "Promotion",
  },
];

const itemTypesWithoutDestination:
  NavigationItemType[] = [
    "DROPDOWN",
    "MEGA_MENU",
    "HEADING",
  ];

  const entityItemTypes:
  NavigationItemType[] = [
    "CATEGORY",
    "BRAND",
    "PRODUCT",
    "COLLECTION",
    "CMS_PAGE",
  ];

  const defaultPromotionSettings = {
    eyebrow:
      null,
  
    title:
      null,
  
    subtitle:
      null,
  
    description:
      null,
  
    ctaText:
      "Shop now",
  
    ctaUrl:
      null,
  
    textAlign:
      "LEFT" as const,
  
    overlay:
      "DARK" as const,
  
    textColor:
      "#FFFFFF",
  
    backgroundColor:
      "#303030",
  };


const createDefaultValues = (
  item?: NavigationItem | null,
  parentItem?: NavigationItem | null
): NavigationItemFormValues => ({
  parentId:
    item?.parentId ??
    parentItem?.id ??
    null,

  label:
    item?.label ||
    "",

  itemType:
    item?.itemType ||
    "CUSTOM_LINK",

  referenceId:
    item?.referenceId ||
    null,

  url:
    item?.url ||
    null,

  icon:
    item?.icon ||
    null,

  mediaAssetId:
    item?.mediaAssetId ||
    null,

  description:
    item?.description ||
    null,

  badgeText:
    item?.badgeText ||
    null,

  badgeColor:
    item?.badgeColor ||
    null,

  displayOrder:
    item?.displayOrder,

  columnNumber:
    item?.columnNumber ||
    parentItem?.columnNumber ||
    1,

  openInNewTab:
    item?.openInNewTab ||
    false,

  desktopVisible:
    item?.desktopVisible ??
    true,

  mobileVisible:
    item?.mobileVisible ??
    true,

  isFeatured:
    item?.isFeatured ||
    false,

  isActive:
    item?.isActive ??
    true,

    settings: {
      ...(item?.settings ||
        {}),
    
      promotion:
        item?.itemType ===
        "PROMOTION"
          ? {
              ...defaultNavigationPromotionSettings,
    
              ...(item.settings
                ?.promotion ||
                {}),
            }
          : item?.settings
              ?.promotion,
    },
});

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(
  /\/api\/v1\/?$/,
  ""
);

const resolveMediaUrl = (
  value?:
    string | null
): string | null => {
  if (!value) {
    return null;
  }

  if (
    value.startsWith(
      "http://"
    ) ||
    value.startsWith(
      "https://"
    )
  ) {
    return value;
  }

  return `${API_BASE_URL}${value}`;
};

const getAssetPreviewUrl = (
  asset?:
    MediaAsset | null
): string | null => {
  if (!asset) {
    return null;
  }

  const preview =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "PREVIEW" &&
        variant.format ===
          "webp" &&
        variant.isActive
    );

  const thumbnail =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "THUMBNAIL" &&
        variant.format ===
          "webp" &&
        variant.isActive
    );

  return resolveMediaUrl(
    preview?.publicUrl ||
      thumbnail?.publicUrl ||
      asset.publicUrl
  );
};

export default function NavigationItemModal({
  isOpen,
  item,
  parentItem,
  maxColumns,
  isSaving,
  onClose,
  onSubmit,
}: NavigationItemModalProps) {
  const [
    values,
    setValues,
  ] =
    useState<NavigationItemFormValues>(
      createDefaultValues(
        item,
        parentItem
      )
    );

  const [
    selectedAsset,
    setSelectedAsset,
  ] =
    useState<MediaAsset | null>(
      item?.mediaAsset ||
        null
    );

  const [
    isMediaPickerOpen,
    setIsMediaPickerOpen,
  ] = useState(false);

  const [
    isEntityPickerOpen,
    setIsEntityPickerOpen,
  ] = useState(false);

  useEffect(() => {
    setValues(
      createDefaultValues(
        item,
        parentItem
      )
    );

    setSelectedAsset(
      item?.mediaAsset ||
        null
    );

    setIsMediaPickerOpen(
      false
    );

    setIsEntityPickerOpen(
      false
    );
  }, [
    item,
    parentItem,
    isOpen,
  ]);

  const isEditing =
    Boolean(item);

  const previewUrl =
    useMemo(
      () =>
        getAssetPreviewUrl(
          selectedAsset
        ),
      [selectedAsset]
    );

  const setField = <
    K extends keyof NavigationItemFormValues,
  >(
    field: K,
    value:
      NavigationItemFormValues[K]
  ) => {
    setValues(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  };

  const handleItemTypeChange = (
  nextType:
    NavigationItemType
) => {
  setValues(
    (current) => {
      const hasNoDestination =
        itemTypesWithoutDestination.includes(
          nextType
        );

      const usesEntityPicker =
        entityItemTypes.includes(
          nextType
        );

      return {
        ...current,

        itemType:
          nextType,

        referenceId:
          null,

        url:
          hasNoDestination ||
          usesEntityPicker
            ? null
            : current.url,

        settings: {
          ...current.settings,

          promotion:
            nextType ===
            "PROMOTION"
              ? {
                  ...defaultNavigationPromotionSettings,

                  ...(current.settings
                    .promotion ||
                    {}),
                }
              : current.settings
                  .promotion,
        },
      };
    }
  );

  setIsEntityPickerOpen(
    false
  );
};

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const cleanedLabel =
        values.label.trim();

      if (!cleanedLabel) {
        toast.error(
          "Please enter a navigation item label."
        );

        return;
      }

      if (
        entityItemTypes.includes(
          values.itemType
        ) &&
        !values.referenceId
      ) {
        toast.error(
          `Please select a ${formatItemType(
            values.itemType
          ).toLowerCase()}.`
        );
      
        return;
      }

      if (
        values.itemType ===
          "CUSTOM_LINK" &&
        !values.url?.trim()
      ) {
        toast.error(
          "Please enter a URL for the custom link."
        );

        return;
      }

      if (
        values.itemType ===
        "PROMOTION"
      ) {
        const promotion =
          values.settings
            .promotion;
      
        const hasImage =
          Boolean(
            selectedAsset?.id
          );
      
        const hasBackgroundColour =
          Boolean(
            promotion
              ?.backgroundColor
              ?.trim()
          );
      
        const hasTitle =
          Boolean(
            promotion
              ?.title
              ?.trim() ||
            cleanedLabel
          );
      
        if (
          !hasImage &&
          !hasBackgroundColour
        ) {
          toast.error(
            "Please select a promotional image or enter a background colour."
          );
      
          return;
        }
      
        if (!hasTitle) {
          toast.error(
            "Please enter a promotion title."
          );
      
          return;
        }
      
        if (
          promotion
            ?.ctaText
            ?.trim() &&
          !promotion
            .ctaUrl
            ?.trim() &&
          !values.url
            ?.trim()
        ) {
          toast.error(
            "Please enter a CTA destination when CTA text is provided."
          );
      
          return;
        }
      }

      const rules =
  values.settings
    .visibilityRules;

if (
  rules &&
  rules.channels.length ===
    0
) {
  toast.error(
    "Select at least one display channel."
  );

  return;
}

if (
  rules &&
  rules.devices.length ===
    0
) {
  toast.error(
    "Select at least one device."
  );

  return;
}

if (
  rules?.requirePromotion &&
  rules.promotionStartAt &&
  rules.promotionEndAt &&
  new Date(
    rules.promotionEndAt
  ).getTime() <=
    new Date(
      rules.promotionStartAt
    ).getTime()
) {
  toast.error(
    "Promotion end time must be later than the start time."
  );

  return;
}


const cleanedPromotion =
  values.itemType ===
  "PROMOTION"
    ? {
        ...defaultNavigationPromotionSettings,

        ...(values.settings
          .promotion ||
          {}),

        eyebrow:
          values.settings
            .promotion
            ?.eyebrow
            ?.trim() ||
          null,

        title:
          values.settings
            .promotion
            ?.title
            ?.trim() ||
          cleanedLabel,

        subtitle:
          values.settings
            .promotion
            ?.subtitle
            ?.trim() ||
          null,

        description:
          values.settings
            .promotion
            ?.description
            ?.trim() ||
          null,

        ctaText:
          values.settings
            .promotion
            ?.ctaText
            ?.trim() ||
          null,

        ctaUrl:
          values.settings
            .promotion
            ?.ctaUrl
            ?.trim() ||
          values.url
            ?.trim() ||
          null,

        textColor:
          values.settings
            .promotion
            ?.textColor
            ?.trim() ||
          null,

        backgroundColor:
          values.settings
            .promotion
            ?.backgroundColor
            ?.trim() ||
          null,
      }
    : values.settings
        .promotion;

      await onSubmit({
        ...values,

        label:
          cleanedLabel,

        url:
          values.url?.trim() ||
          null,

        icon:
          values.icon?.trim() ||
          null,

        referenceId:
          values.referenceId
            ?.trim() ||
          null,

        description:
          values.description
            ?.trim() ||
          null,

        badgeText:
          values.badgeText
            ?.trim() ||
          null,

        badgeColor:
          values.badgeColor
            ?.trim() ||
          null,

          mediaAssetId:
          selectedAsset?.id ||
          null,
        
        settings: {
          ...values.settings,
        
          promotion:
            cleanedPromotion,
        },
      });
    };

  const selectAsset = (
    asset:
      MediaAsset
  ) => {
    setSelectedAsset(
      asset
    );

    setField(
      "mediaAssetId",
      asset.id
    );

    setIsMediaPickerOpen(
      false
    );
  };

  const clearAsset =
    () => {
      setSelectedAsset(
        null
      );

      setField(
        "mediaAssetId",
        null
      );
    };

  const handleEntitySelect = (
    selection:
      NavigationEntitySelection
  ) => {
    setValues(
      (current) => ({
        ...current,

        referenceId:
          selection.id,

        url:
          selection.url,

        label:
          current.label.trim()
            ? current.label
            : selection.label,
      })
    );

    setIsEntityPickerOpen(
      false
    );
  };

  const clearEntitySelection =
    () => {
      setField(
        "referenceId",
        null
      );

      setField(
        "url",
        null
      );
    };

  const closeModal =
    () => {
      if (isSaving) {
        return;
      }

      setIsMediaPickerOpen(
        false
      );

      setIsEntityPickerOpen(
        false
      );

      onClose();
    };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[120] bg-black/35"
        onMouseDown={(
          event
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeModal();
          }
        }}
      >
        <aside
          className="absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col border-l border-[#dfe3e8] bg-white shadow-2xl"
          onMouseDown={(
            event
          ) =>
            event.stopPropagation()
          }
        >
          <header className="flex items-start justify-between border-b border-[#e1e3e5] px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#8c9196]">
                Navigation item
              </p>

              <h2 className="mt-1 text-lg font-semibold">
                {isEditing
                  ? "Edit menu item"
                  : parentItem
                    ? `Add child to ${parentItem.label}`
                    : "Add top-level item"}
              </h2>
            </div>

            <button
              type="button"
              onClick={
                closeModal
              }
              disabled={
                isSaving
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3] disabled:opacity-50"
              aria-label="Close navigation item"
            >
              <X
                size={19}
              />
            </button>
          </header>

          <form
            onSubmit={
              handleSubmit
            }
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <section>
                <h3 className="text-sm font-semibold">
                  Item details
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium">
                      Label
                    </label>

                    <input
                      value={
                        values.label
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "label",
                          event
                            .target
                            .value
                        )
                      }
                      className="admin-input"
                      placeholder="Gaming laptops"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Item type
                    </label>

                    <select
                      value={
                        values.itemType
                      }
                      onChange={(
                        event
                      ) =>
                        handleItemTypeChange(
                          event
                            .target
                            .value as NavigationItemType
                        )
                      }
                      className="admin-input"
                    >
                      {itemTypes.map(
                        (
                          itemType
                        ) => (
                          <option
                            key={
                              itemType.value
                            }
                            value={
                              itemType.value
                            }
                          >
                            {
                              itemType.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Mega-menu column
                    </label>

                    <select
                      value={
                        values.columnNumber
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "columnNumber",
                          Number(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      className="admin-input"
                    >
                      {Array.from(
                        {
                          length:
                            Math.max(
                              maxColumns,
                              1
                            ),
                        },
                        (
                          _value,
                          index
                        ) =>
                          index +
                          1
                      ).map(
                        (
                          column
                        ) => (
                          <option
                            key={
                              column
                            }
                            value={
                              column
                            }
                          >
                            Column{" "}
                            {
                              column
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {isNavigationEntityType(
                    values.itemType
                  ) ? (
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium">
                        {formatItemType(
                          values.itemType
                        )}
                      </label>

                      {values.referenceId ? (
                        <div className="rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                              <FileText
                                size={18}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                Selected{" "}
                                {formatItemType(
                                  values.itemType
                                ).toLowerCase()}
                              </p>

                              <p className="mt-1 truncate font-mono text-xs text-[#6d7175]">
                                {values.url ||
                                  values.referenceId}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setIsEntityPickerOpen(
                                  true
                                )
                              }
                              className="h-9 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium"
                            >
                              Change
                            </button>

                            <button
                              type="button"
                              onClick={
                                clearEntitySelection
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                              aria-label="Clear selected destination"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setIsEntityPickerOpen(
                              true
                            )
                          }
                          className="flex min-h-[88px] w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[#babfc3] bg-[#fafafa] text-sm font-medium hover:bg-[#f6f6f7]"
                        >
                          <FileText
                            size={20}
                          />

                          Select{" "}
                          {formatItemType(
                            values.itemType
                          ).toLowerCase()}
                        </button>
                      )}

                      <p className="mt-2 text-xs text-[#6d7175]">
                        The URL will be generated automatically from the selected record.
                      </p>
                    </div>
                  ) : (
                    <>
                      {!itemTypesWithoutDestination.includes(
                        values.itemType
                      ) ? (
                        <div className="md:col-span-2">
                          <label className="mb-1.5 block text-sm font-medium">
                            URL
                          </label>

                          <input
                            value={
                              values.url ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              setField(
                                "url",
                                event.target
                                  .value
                              )
                            }
                            className="admin-input"
                            placeholder="/category/gaming-laptops"
                          />

                          {values.itemType ===
                          "PROMOTION" ? (
                            <p className="mt-1.5 text-xs text-[#6d7175]">
                              Optional when the promotion is image-only.
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {itemTypesWithoutDestination.includes(
                        values.itemType
                      ) ? (
                        <div className="md:col-span-2">
                          <div className="rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4">
                            <p className="text-sm font-medium">
                              No destination required
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                              This item is used as a navigation container or heading. Add child items beneath it.
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Icon
                    </label>

                    <input
                      value={
                        values.icon ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "icon",
                          event
                            .target
                            .value
                        )
                      }
                      className="admin-input"
                      placeholder="Laptop"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Badge text
                    </label>

                    <input
                      value={
                        values.badgeText ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setField(
                          "badgeText",
                          event
                            .target
                            .value
                        )
                      }
                      className="admin-input"
                      placeholder="New"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Badge colour
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={
                          normalizeHexColor(
                            values.badgeColor
                          )
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "badgeColor",
                            event
                              .target
                              .value
                          )
                        }
                        className="h-10 w-12 rounded-lg border border-[#babfc3] bg-white p-1"
                        aria-label="Select badge colour"
                      />

                      <input
                        value={
                          values.badgeColor ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          setField(
                            "badgeColor",
                            event
                              .target
                              .value
                          )
                        }
                        className="admin-input flex-1"
                        placeholder="#DC2626"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium">
                      Description
                    </label>

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
                      className="admin-input min-h-[90px] resize-y"
                      placeholder="Optional navigation description"
                    />
                  </div>
                </div>
              </section>

              {values.itemType ===
  "PROMOTION" && (
  <NavigationPromotionEditor
    settings={
      values.settings
    }
    onChange={(
      settings
    ) =>
      setField(
        "settings",
        settings
      )
    }
  />
)}

              <section className="border-t border-[#e1e3e5] pt-6">
                <h3 className="text-sm font-semibold">
                  Promotional image
                </h3>

                <p className="mt-1 text-xs text-[#6d7175]">
                  Used for promotional blocks, featured links and mega-menu
                  content.
                </p>

                {selectedAsset ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-[#e1e3e5]">
                    <div className="flex min-h-[180px] items-center justify-center bg-[#f6f6f7]">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            previewUrl
                          }
                          alt={
                            selectedAsset.altText ||
                            selectedAsset.title ||
                            selectedAsset.originalFileName
                          }
                          className="max-h-[220px] w-full object-contain p-4"
                        />
                      ) : (
                        <ImageIcon
                          size={36}
                          className="text-[#8c9196]"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {selectedAsset.title ||
                            selectedAsset.originalFileName}
                        </p>

                        <p className="mt-1 text-xs text-[#6d7175]">
                          {
                            selectedAsset.classification
                          }
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setIsMediaPickerOpen(
                              true
                            )
                          }
                          className="h-9 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium"
                        >
                          Change
                        </button>

                        <button
                          type="button"
                          onClick={
                            clearAsset
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                          aria-label="Remove promotional image"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setIsMediaPickerOpen(
                        true
                      )
                    }
                    className="mt-4 flex min-h-[120px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#babfc3] bg-[#fafafa] hover:bg-[#f6f6f7]"
                  >
                    <ImageIcon
                      size={26}
                    />

                    <span className="mt-2 text-sm font-medium">
                      Select from DAM
                    </span>

                    <span className="mt-1 text-xs text-[#6d7175]">
                      Optional
                    </span>
                  </button>
                )}
              </section>

              <section className="border-t border-[#e1e3e5] pt-6">
                <h3 className="text-sm font-semibold">
                  Visibility
                </h3>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <BooleanCard
                    label="Active"
                    value={
                      values.isActive
                    }
                    onChange={(
                      value
                    ) =>
                      setField(
                        "isActive",
                        value
                      )
                    }
                  />

                  <BooleanCard
                    label="Desktop visible"
                    value={
                      values.desktopVisible
                    }
                    onChange={(
                      value
                    ) =>
                      setField(
                        "desktopVisible",
                        value
                      )
                    }
                  />

                  <BooleanCard
                    label="Mobile visible"
                    value={
                      values.mobileVisible
                    }
                    onChange={(
                      value
                    ) =>
                      setField(
                        "mobileVisible",
                        value
                      )
                    }
                  />

                  <BooleanCard
                    label="Featured item"
                    value={
                      values.isFeatured
                    }
                    onChange={(
                      value
                    ) =>
                      setField(
                        "isFeatured",
                        value
                      )
                    }
                  />

                  <BooleanCard
                    label="Open in new tab"
                    value={
                      values.openInNewTab
                    }
                    onChange={(
                      value
                    ) =>
                      setField(
                        "openInNewTab",
                        value
                      )
                    }
                  />
                </div>
              </section>

              <NavigationRulesEditor
  settings={
    values.settings
  }
  onChange={(
    settings
  ) =>
    setField(
      "settings",
      settings
    )
  }
/>
            </div>

            <footer className="flex justify-end gap-2 border-t border-[#e1e3e5] bg-[#fafafa] px-6 py-4">
              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  isSaving
                }
                className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isSaving
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSaving ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Save
                    size={16}
                  />
                )}

                {isEditing
                  ? "Save changes"
                  : "Add item"}
              </button>
            </footer>
          </form>
        </aside>
      </div>

      <MediaAssetPicker
        isOpen={
          isMediaPickerOpen
        }
        selectedAssetId={
          selectedAsset?.id ||
          null
        }
        title="Select navigation image"
        description="Choose an image for this navigation item."
        classification="CMS"
        onClose={() =>
          setIsMediaPickerOpen(
            false
          )
        }
        onSelect={
          selectAsset
        }
      />

      {isNavigationEntityType(
        values.itemType
      ) ? (
        <NavigationEntityPicker
          isOpen={
            isEntityPickerOpen
          }
          entityType={
            values.itemType
          }
          selectedId={
            values.referenceId
          }
          onClose={() =>
            setIsEntityPickerOpen(
              false
            )
          }
          onSelect={
            handleEntitySelect
          }
        />
      ) : null}
    </>
  );
}

interface BooleanCardProps {
  label: string;
  value: boolean;

  onChange: (
    value:
      boolean
  ) => void;
}

function BooleanCard({
  label,
  value,
  onChange,
}: BooleanCardProps) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !value
        )
      }
      className="flex items-center justify-between rounded-xl border border-[#e1e3e5] p-4 text-left hover:bg-[#fafafa]"
    >
      <span className="text-sm font-medium">
        {label}
      </span>

      <span
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition",
          value
            ? "bg-[#303030]"
            : "bg-[#c9cccf]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            value
              ? "left-[22px]"
              : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function normalizeHexColor(
  value?:
    string | null
): string {
  if (
    value &&
    /^#[0-9a-fA-F]{6}$/.test(
      value
    )
  ) {
    return value;
  }

  return "#DC2626";
}

function formatItemType(
  value:
    NavigationItemType
): string {
  return value
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}