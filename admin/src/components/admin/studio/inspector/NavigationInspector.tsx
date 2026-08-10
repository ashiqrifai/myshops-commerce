"use client";

import {
  Link2,
  Settings2,
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

interface NavigationInspectorProps {
  item: NavigationItem;

  onEdit: (
    item: NavigationItem
  ) => void;

  onClose?: () => void;
}

type NavigationInspectorTabId =
  | "CONTENT"
  | "RULES";

export default function NavigationInspector({
  item,
  onEdit,
  onClose,
}: NavigationInspectorProps) {
  const [
    activeTab,
    setActiveTab,
  ] = useState<NavigationInspectorTabId>(
    "CONTENT"
  );

  const tabs =
    useMemo<InspectorTab[]>(
      () => [
        {
          id: "CONTENT",
          label: "Content",
          icon: (
            <Link2
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
      title="Navigation inspector"
      subtitle={
        item.label
      }
      badge={
        formatItemType(
          item.itemType
        )
      }
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
          tabId as NavigationInspectorTabId
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
        <NavigationContentTab
          item={
            item
          }
        />
      ) : (
        <NavigationRulesTab
          item={
            item
          }
        />
      )}
    </StudioInspector>
  );
}

function NavigationContentTab({
  item,
}: {
  item: NavigationItem;
}) {
  return (
    <>
      <InspectorSection
        title="Identity"
        description="Basic information for the selected navigation item."
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
            value={
              formatItemType(
                item.itemType
              )
            }
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
        title="Destination"
        description="Where this navigation item sends the customer."
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#005bd3]">
            <Link2
              size={16}
            />
          </div>

          <div className="min-w-0">
            <p className="break-all text-sm font-medium">
              {
                item.url ||
                item.referenceId ||
                "No destination configured"
              }
            </p>
          </div>
        </div>
      </InspectorSection>
    </>
  );
}

function NavigationRulesTab({
  item,
}: {
  item: NavigationItem;
}) {
  return (
    <InspectorSection
      title="Visibility"
      description="Availability and status of the selected navigation item."
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

function formatItemType(
  value: string
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