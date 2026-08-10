"use client";

import type {
  ReactNode,
} from "react";

export interface InspectorTab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface InspectorTabsProps {
  tabs: InspectorTab[];
  activeTab: string;
  onChange: (
    tabId: string
  ) => void;
}

export default function InspectorTabs({
  tabs,
  activeTab,
  onChange,
}: InspectorTabsProps) {
  return (
    <div className="border-b border-[#e1e3e5] bg-white px-3 py-2">
      <div
        className="grid gap-1 rounded-xl bg-[#f1f2f3] p-1"
        style={{
          gridTemplateColumns:
            `repeat(${Math.max(
              tabs.length,
              1
            )}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map(
          (tab) => {
            const isActive =
              activeTab ===
              tab.id;

            return (
              <button
                key={
                  tab.id
                }
                type="button"
                disabled={
                  tab.disabled
                }
                onClick={() =>
                  onChange(
                    tab.id
                  )
                }
                className={[
                  "flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-medium transition",

                  isActive
                    ? "bg-white text-[#202223] shadow-sm"
                    : "text-[#6d7175] hover:text-[#202223]",

                  tab.disabled
                    ? "cursor-not-allowed opacity-40"
                    : "",
                ].join(
                  " "
                )}
                aria-pressed={
                  isActive
                }
              >
                {tab.icon}

                <span className="truncate">
                  {tab.label}
                </span>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}