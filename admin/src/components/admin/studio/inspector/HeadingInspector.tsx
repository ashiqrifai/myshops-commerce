"use client";

import {
  Settings2,
  Type,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import InspectorSection from "./InspectorSection";
import StudioInspector from "./StudioInspector";

import type {
  InspectorTab,
} from "./InspectorTabs";

import type {
  NavigationItem,
} from "@/types/navigation";

interface HeadingInspectorProps {
  item: NavigationItem;

  onEdit: (
    item: NavigationItem
  ) => void;

  onClose?: () => void;
}

type HeadingInspectorTabId =
  | "CONTENT"
  | "RULES";

export default function HeadingInspector({
  item,
  onEdit,
  onClose,
}: HeadingInspectorProps) {
  const [
    activeTab,
    setActiveTab,
  ] = useState<HeadingInspectorTabId>(
    "CONTENT"
  );

  const tabs =
    useMemo<InspectorTab[]>(
      () => [
        {
          id: "CONTENT",
          label: "Content",
          icon: (
            <Type
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

  return (
    <StudioInspector
      title="Heading inspector"
      subtitle={
        item.label
      }
      badge="Heading"
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
          tabId as HeadingInspectorTabId
        )
      }
      onClose={
        onClose
      }
      footer={
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
      }
    >
      {activeTab ===
      "CONTENT" ? (
        <HeadingContentTab
          item={
            item
          }
        />
      ) : (
        <HeadingRulesTab
          item={
            item
          }
        />
      )}
    </StudioInspector>
  );
}

function HeadingContentTab({
  item,
}: {
  item: NavigationItem;
}) {
  const childCount =
    item.children?.length ||
    0;

  return (
    <>
      <InspectorSection
        title="Identity"
        description="Basic information for the selected heading."
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
            value="Heading"
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
        title="Heading group"
        description="This heading visually groups related navigation links."
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f2f3] text-[#5c5f62]">
            <Type
              size={16}
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium">
              {item.label}
            </p>

            <p className="mt-1 text-xs text-[#6d7175]">
              {childCount} link
              {childCount === 1
                ? ""
                : "s"}
            </p>
          </div>
        </div>
      </InspectorSection>
    </>
  );
}

function HeadingRulesTab({
  item,
}: {
  item: NavigationItem;
}) {
  return (
    <InspectorSection
      title="Visibility"
      description="Availability and placement of the selected heading."
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

        <InspectorRow
          label="Children"
          value={
            String(
              item.children?.length ||
              0
            )
          }
        />
      </dl>
    </InspectorSection>
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