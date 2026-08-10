"use client";

import type {
  ReactNode,
} from "react";

export type CollectionTabKey =
  | "GENERAL"
  | "PRODUCTS"
  | "SEO";

interface CollectionTab {
  key: CollectionTabKey;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface CollectionTabsProps {
  activeTab:
    CollectionTabKey;

  onChange: (
    tab:
      CollectionTabKey
  ) => void;

  children:
    ReactNode;

  productCount?:
    number;
}

export default function CollectionTabs({
  activeTab,
  onChange,
  children,
  productCount,
}: CollectionTabsProps) {
  const tabs:
    CollectionTab[] = [
      {
        key:
          "GENERAL",

        label:
          "General",
      },

      {
        key:
          "PRODUCTS",

        label:
          "Products",

        count:
          productCount,
      },

      {
        key:
          "SEO",

        label:
          "SEO",
      },
    ];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
      <div className="overflow-x-auto border-b border-[#e1e3e5]">
        <nav
          className="flex min-w-max items-center px-3"
          aria-label="Collection sections"
        >
          {tabs.map(
            (
              tab
            ) => {
              const isActive =
                activeTab ===
                tab.key;

              return (
                <button
                  key={
                    tab.key
                  }
                  type="button"
                  disabled={
                    tab.disabled
                  }
                  onClick={() =>
                    onChange(
                      tab.key
                    )
                  }
                  className={[
                    "relative inline-flex h-14 items-center gap-2 px-4 text-sm font-medium transition",
                    isActive
                      ? "text-[#202223]"
                      : "text-[#6d7175] hover:text-[#202223]",
                    tab.disabled
                      ? "cursor-not-allowed opacity-50"
                      : "",
                  ].join(
                    " "
                  )}
                  aria-current={
                    isActive
                      ? "page"
                      : undefined
                  }
                >
                  <span>
                    {
                      tab.label
                    }
                  </span>

                  {typeof tab.count ===
                    "number" && (
                    <span
                      className={[
                        "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                        isActive
                          ? "bg-[#303030] text-white"
                          : "bg-[#e4e5e7] text-[#4a4f53]",
                      ].join(
                        " "
                      )}
                    >
                      {
                        tab.count
                      }
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#303030]" />
                  )}
                </button>
              );
            }
          )}
        </nav>
      </div>

      <div>
        {
          children
        }
      </div>
    </section>
  );
}