"use client";

import {
  Bot,
  EyeOff,
  Palette,
  Settings2,
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import InspectorSection from "./InspectorSection";
import StudioInspector from "./StudioInspector";

import StudioSelect from "./../shared/fields/StudioSelect";


import type {
  InspectorTab,
} from "./InspectorTabs";

import StudioSaveBar from "./../shared/StudioSaveBar";
import StudioAlignmentPicker from "./../shared/fields/StudioAlignmentPicker";
import StudioTextField from "./../shared/fields/StudioTextField";

import type {
  NavigationItem,
  NavigationPromotionOverlay,
  NavigationPromotionTextAlign,
} from "@/types/navigation";

export interface PromotionInspectorDraft {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  textAlign: NavigationPromotionTextAlign;
  overlay: NavigationPromotionOverlay;
  textColor: string;
  backgroundColor: string;
}

interface PromotionInspectorProps {
  item: NavigationItem;

  onEdit: (
    item: NavigationItem
  ) => void;

  onSave?: (
    item: NavigationItem,
    draft: PromotionInspectorDraft
  ) => Promise<void> | void;

  isSaving?: boolean;
  onClose?: () => void;
}

type PromotionInspectorTabId =
  | "CONTENT"
  | "STYLE"
  | "RULES"
  | "AI";

export default function PromotionInspector({
  item,
  onEdit,
  onSave,
  isSaving = false,
  onClose,
}: PromotionInspectorProps) {
  const [
    activeTab,
    setActiveTab,
  ] = useState<PromotionInspectorTabId>(
    "CONTENT"
  );

  const [
    draft,
    setDraft,
  ] = useState<PromotionInspectorDraft>(
    () =>
      createPromotionDraft(
        item
      )
  );

  useEffect(() => {
    setDraft(
      createPromotionDraft(
        item
      )
    );
  }, [
    item.id,
    item.settings,
    item.url,
  ]);

  const originalDraft =
    useMemo(
      () =>
        createPromotionDraft(
          item
        ),
      [
        item,
      ]
    );

  const isDirty =
    useMemo(
      () =>
        !areDraftsEqual(
          draft,
          originalDraft
        ),
      [
        draft,
        originalDraft,
      ]
    );

  const tabs =
    useMemo<InspectorTab[]>(
      () => [
        {
          id: "CONTENT",
          label: "Content",
          icon: (
            <Sparkles
              size={13}
            />
          ),
        },
        {
          id: "STYLE",
          label: "Style",
          icon: (
            <Palette
              size={13}
            />
          ),
        },
        {
          id: "RULES",
          label: "Rules",
          icon: (
            <Settings2
              size={13}
            />
          ),
        },
        {
          id: "AI",
          label: "AI",
          icon: (
            <Bot
              size={13}
            />
          ),
          disabled: true,
        },
      ],
      []
    );

  useEffect(() => {
    const activeTabExists =
      tabs.some(
        (tab) =>
          tab.id ===
            activeTab &&
          !tab.disabled
      );

    if (!activeTabExists) {
      setActiveTab(
        "CONTENT"
      );
    }
  }, [
    activeTab,
    tabs,
  ]);

  const updateDraft = <
    Key extends keyof PromotionInspectorDraft
  >(
    field: Key,
    value: PromotionInspectorDraft[Key]
  ) => {
    setDraft(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  };

  const handleDiscard =
    () => {
      setDraft(
        originalDraft
      );
    };

  const handleSave =
    async () => {
      if (!onSave) {
        return;
      }

      await onSave(
        item,
        draft
      );
    };

  return (
    <StudioInspector
      title="Promotion inspector"
      subtitle={
        item.label
      }
      badge="Promotion"
      tabs={
        tabs
      }
      activeTab={
        activeTab
      }
      onTabChange={(
        tabId
      ) =>
        setActiveTab(
          tabId as PromotionInspectorTabId
        )
      }
      onClose={
        onClose
      }
      footer={
        isDirty ? (
          <StudioSaveBar
            isDirty
            isSaving={
              isSaving
            }
            onDiscard={
              handleDiscard
            }
            onSave={
              handleSave
            }
          />
        ) : (
          <button
            type="button"
            onClick={() =>
              onEdit(
                item
              )
            }
            className="flex h-10 w-full items-center justify-center rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white transition hover:bg-[#1f1f1f]"
          >
            Edit full settings
          </button>
        )
      }
    >
      {activeTab ===
      "CONTENT" ? (
        <PromotionContentTab
          item={
            item
          }
          draft={
            draft
          }
          onChange={
            updateDraft
          }
        />
      ) : activeTab ===
        "STYLE" ? (
        <PromotionStyleTab
          item={
            item
          }
          draft={
            draft
          }
          onChange={
            updateDraft
          }
        />
      ) : activeTab ===
        "RULES" ? (
        <PromotionRulesTab
          item={
            item
          }
        />
      ) : (
        <InspectorSection
          title="AI assistant"
          description="AI editing tools will be connected after the core inspector workflow is complete."
        >
          <p className="text-sm text-[#6d7175]">
            Coming soon.
          </p>
        </InspectorSection>
      )}
    </StudioInspector>
  );
}

function PromotionContentTab({
  item,
  draft,
  onChange,
}: {
  item: NavigationItem;
  draft: PromotionInspectorDraft;

  onChange: <
    Key extends keyof PromotionInspectorDraft
  >(
    field: Key,
    value: PromotionInspectorDraft[Key]
  ) => void;
}) {
  return (
    <>
      <InspectorSection
        title="Identity"
        description="Basic information for the selected promotion."
      >
        <dl className="space-y-3 text-sm">
          <InspectorRow
            label="Label"
            value={
              item.label
            }
          />

          <InspectorRow
            label="Type"
            value="Promotion"
          />

          <InspectorRow
            label="Status"
            value={
              item.isActive
                ? "Active"
                : "Inactive"
            }
          />
        </dl>
      </InspectorSection>

      <InspectorSection
        title="Promotion content"
        description="Edit promotional messaging and its call-to-action."
      >
        <div className="space-y-4">
          <StudioTextField
            id={`promotion-${item.id}-eyebrow`}
            label="Eyebrow"
            value={
              draft.eyebrow
            }
            onChange={(
              value
            ) =>
              onChange(
                "eyebrow",
                value
              )
            }
            placeholder="New arrival"
            maxLength={
              60
            }
          />

          <StudioTextField
            id={`promotion-${item.id}-title`}
            label="Title"
            value={
              draft.title
            }
            onChange={(
              value
            ) =>
              onChange(
                "title",
                value
              )
            }
            placeholder="Promotion title"
            maxLength={
              120
            }
          />

          <StudioTextField
            id={`promotion-${item.id}-subtitle`}
            label="Subtitle"
            value={
              draft.subtitle
            }
            onChange={(
              value
            ) =>
              onChange(
                "subtitle",
                value
              )
            }
            placeholder="Short supporting message"
            maxLength={
              180
            }
          />

          <StudioTextField
            id={`promotion-${item.id}-description`}
            label="Description"
            value={
              draft.description
            }
            onChange={(
              value
            ) =>
              onChange(
                "description",
                value
              )
            }
            placeholder="Optional promotion description"
            maxLength={
              240
            }
          />

          <StudioTextField
            id={`promotion-${item.id}-cta-text`}
            label="CTA text"
            value={
              draft.ctaText
            }
            onChange={(
              value
            ) =>
              onChange(
                "ctaText",
                value
              )
            }
            placeholder="Shop now"
            maxLength={
              40
            }
          />

          <StudioTextField
            id={`promotion-${item.id}-cta-url`}
            label="CTA URL"
            value={
              draft.ctaUrl
            }
            onChange={(
              value
            ) =>
              onChange(
                "ctaUrl",
                value
              )
            }
            placeholder="/collections/new-arrivals"
            helperText="Use a storefront path or a complete URL."
          />
        </div>
      </InspectorSection>
    </>
  );
}

function PromotionStyleTab({
    item,
    draft,
    onChange,
  }: {
    item: NavigationItem;
  
    draft: PromotionInspectorDraft;
  
    onChange: <
      Key extends keyof PromotionInspectorDraft
    >(
      field: Key,
      value: PromotionInspectorDraft[Key]
    ) => void;
  }) {
    return (
      <>
        <InspectorSection
          title="Text alignment"
          description="Control how promotion content is positioned inside the promotion card."
        >
          <StudioAlignmentPicker
            id={`promotion-${item.id}-alignment`}
            label="Alignment"
            value={
              draft.textAlign
            }
            onChange={(
              value
            ) =>
              onChange(
                "textAlign",
                value
              )
            }
            helperText="Choose left, centre or right alignment."
          />
        </InspectorSection>
  
        <InspectorSection
          title="Visual style"
          description="Current presentation settings for this promotion."
        >
          <dl className="space-y-3 text-sm">
            <InspectorRow
              label="Image"
              value={
                item.mediaAssetId
                  ? "Configured"
                  : "Missing"
              }
            />
  
  <StudioSelect<NavigationPromotionOverlay>
  id={`promotion-${item.id}-overlay`}
  label="Overlay"
  value={
    draft.overlay
  }
  options={[
    {
      value: "NONE",
      label: "None",
    },
    {
      value: "LIGHT",
      label: "Light",
    },
    {
      value: "DARK",
      label: "Dark",
    },
  ]}
  onChange={(
    value
  ) =>
    onChange(
      "overlay",
      value
    )
  }
  helperText="Adds contrast between the promotion image and the content."
/>
  
            <InspectorRow
              label="Text colour"
              value={
                draft.textColor ||
                "Default"
              }
            />
  
            <InspectorRow
              label="Background"
              value={
                draft.backgroundColor ||
                "Default"
              }
            />
          </dl>
        </InspectorSection>
  
        <InspectorSection
          title="Promotion layouts"
          description="Additional promotion layouts will be configured here."
        >
          <p className="text-sm text-[#6d7175]">
            Hero, side-card and multi-card layouts will be added next.
          </p>
        </InspectorSection>
      </>
    );
  }

function PromotionRulesTab({
  item,
}: {
  item: NavigationItem;
}) {
  return (
    <>
      <InspectorSection
        title="Visibility"
        description="Availability and status of the selected promotion."
      >
        <dl className="space-y-3 text-sm">
          <InspectorRow
            label="Active"
            value={
              item.isActive
                ? "Yes"
                : "No"
            }
          />

          <InspectorRow
            label="Column"
            value={
              String(
                item.columnNumber ||
                1
              )
            }
          />
        </dl>
      </InspectorSection>

      {!item.isActive && (
        <InspectorSection
          title="Hidden promotion"
          description="This promotion is currently inactive."
        >
          <div className="flex items-center gap-2 text-sm text-[#a23b2a]">
            <EyeOff
              size={15}
            />

            Customers will not see this promotion.
          </div>
        </InspectorSection>
      )}
    </>
  );
}

function InspectorRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f1f2f3] pb-3 last:border-b-0 last:pb-0">
      <dt className="text-[#6d7175]">
        {label}
      </dt>

      <dd className="max-w-[60%] break-words text-right font-medium">
        {value}
      </dd>
    </div>
  );
}

function createPromotionDraft(
  item:
    NavigationItem
): PromotionInspectorDraft {
  const promotion =
    item.settings
      ?.promotion;

  return {
    eyebrow:
      promotion?.eyebrow ||
      "",

    title:
      promotion?.title ||
      "",

    subtitle:
      promotion?.subtitle ||
      "",

    description:
      promotion?.description ||
      "",

    ctaText:
      promotion?.ctaText ||
      "",

    ctaUrl:
      promotion?.ctaUrl ||
      item.url ||
      "",

    textAlign:
      promotion?.textAlign ||
      "LEFT",

    overlay:
      promotion?.overlay ||
      "NONE",

    textColor:
      promotion?.textColor ||
      "#FFFFFF",

    backgroundColor:
      promotion?.backgroundColor ||
      "#000000",
  };
}

function areDraftsEqual(
  first:
    PromotionInspectorDraft,
  second:
    PromotionInspectorDraft
): boolean {
  return (
    first.eyebrow ===
      second.eyebrow &&
    first.title ===
      second.title &&
    first.subtitle ===
      second.subtitle &&
    first.description ===
      second.description &&
    first.ctaText ===
      second.ctaText &&
    first.ctaUrl ===
      second.ctaUrl &&
    first.textAlign ===
      second.textAlign &&
    first.overlay ===
      second.overlay &&
    first.textColor ===
      second.textColor &&
    first.backgroundColor ===
      second.backgroundColor
  );
}