"use client";

import type {
  ReactNode,
} from "react";

import InspectorContent from "./InspectorContent";
import InspectorFooter from "./InspectorFooter";
import InspectorHeader from "./InspectorHeader";
import InspectorTabs, {
  type InspectorTab,
} from "./InspectorTabs";

interface StudioInspectorProps {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  tabs?: InspectorTab[];
  activeTab?: string | null;
  onTabChange?: (
    tabId: string
  ) => void;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  minHeightClassName?: string;
}

export default function StudioInspector({
  title,
  subtitle,
  badge,
  tabs = [],
  activeTab = null,
  onTabChange,
  children,
  footer,
  onClose,
  minHeightClassName =
    "min-h-[720px]",
}: StudioInspectorProps) {
  const showTabs =
    tabs.length > 0 &&
    Boolean(
      activeTab
    ) &&
    Boolean(
      onTabChange
    );

  return (
    <aside
      className={[
        "flex h-full min-w-0 flex-col bg-white",
        minHeightClassName,
      ].join(
        " "
      )}
    >
      <InspectorHeader
        title={
          title
        }
        subtitle={
          subtitle
        }
        badge={
          badge
        }
        onClose={
          onClose
        }
      />

      {showTabs && (
        <InspectorTabs
          tabs={
            tabs
          }
          activeTab={
            activeTab as string
          }
          onChange={
            onTabChange as (
              tabId: string
            ) => void
          }
        />
      )}

      <InspectorContent>
        {children}
      </InspectorContent>

      {footer && (
        <InspectorFooter>
          {footer}
        </InspectorFooter>
      )}
    </aside>
  );
}