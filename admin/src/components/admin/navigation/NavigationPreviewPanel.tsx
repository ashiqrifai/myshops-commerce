"use client";

import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Menu,
  Monitor,
  Smartphone,
} from "lucide-react";

import { useState } from "react";

import NavigationPromotionCard from "./NavigationPromotionCard";

import { getNavigationAssetImageUrl } from "./navigationMedia";

import type { NavigationItem, NavigationMenu } from "@/types/navigation";

type PreviewMode = "DESKTOP" | "MOBILE";

interface NavigationPreviewPanelProps {
  menu: NavigationMenu;

  items: NavigationItem[];

  selectedItem: NavigationItem | null;

  onSelectItem: (item: NavigationItem) => void;
}

export default function NavigationPreviewPanel({
  menu,
  items,
  selectedItem,
  onSelectItem,
}: NavigationPreviewPanelProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("DESKTOP");

  return (
    <div className="flex h-full min-h-[720px] flex-col bg-white">
      <header className="border-b border-[#e1e3e5] px-5 py-4">
        <div className="flex items-center gap-2">
          <Monitor size={17} className="text-[#5c5f62]" />

          <h2 className="text-sm font-semibold">Live preview</h2>
        </div>

        <p className="mt-1 text-xs leading-5 text-[#6d7175]">
          Preview the navigation structure while editing.
        </p>

        <div className="mt-4 grid grid-cols-2 rounded-lg bg-[#f1f2f3] p-1">
          <PreviewModeButton
            active={previewMode === "DESKTOP"}
            icon={<Monitor size={14} />}
            label="Desktop"
            onClick={() => setPreviewMode("DESKTOP")}
          />

          <PreviewModeButton
            active={previewMode === "MOBILE"}
            icon={<Smartphone size={14} />}
            label="Mobile"
            onClick={() => setPreviewMode("MOBILE")}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6f6f7] p-4">
        {previewMode === "DESKTOP" ? (
          <DesktopPreview
            menu={menu}
            items={items}
            selectedItem={selectedItem}
            onSelectItem={onSelectItem}
          />
        ) : (
          <MobilePreview
            menu={menu}
            items={items}
            selectedItem={selectedItem}
            onSelectItem={onSelectItem}
          />
        )}
      </div>

      <footer className="border-t border-[#e1e3e5] bg-white px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">
              {selectedItem?.label || "No item selected"}
            </p>

            <p className="mt-0.5 truncate text-[11px] text-[#8c9196]">
              {selectedItem?.url || selectedItem?.itemType || menu.code}
            </p>
          </div>

          {selectedItem?.url && (
            <a
              href={selectedItem.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#babfc3] bg-white"
              title="Open destination"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}

interface PreviewModeButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function PreviewModeButton({
  active,
  icon,
  label,
  onClick,
}: PreviewModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-8 items-center justify-center gap-2 rounded-md text-xs font-medium transition",
        active
          ? "bg-white text-[#202223] shadow-sm"
          : "text-[#6d7175] hover:text-[#202223]",
      ].join(" ")}
    >
      {icon}

      {label}
    </button>
  );
}

interface PreviewProps {
  menu: NavigationMenu;

  items: NavigationItem[];

  selectedItem: NavigationItem | null;

  onSelectItem: (item: NavigationItem) => void;
}

function DesktopPreview({
  menu,
  items,
  selectedItem,
  onSelectItem,
}: PreviewProps) {
  const selectedRoot =
    getSelectedRootItem(items, selectedItem?.id || null) || items[0] || null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#dfe3e8] bg-white shadow-sm">
      <div className="flex h-11 items-center justify-between border-b border-[#e1e3e5] px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#303030] text-xs font-bold text-white">
            M
          </div>

          <span className="text-xs font-semibold">MyShops</span>
        </div>

        <div className="h-7 w-16 rounded-full bg-[#f1f2f3]" />
      </div>

      <nav className="flex min-h-12 flex-wrap items-center gap-1 border-b border-[#e1e3e5] px-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectItem(item)}
            className={[
              "flex h-9 items-center gap-1 rounded-lg px-2.5 text-[11px] font-medium transition",
              selectedRoot?.id === item.id
                ? "bg-[#303030] text-white"
                : "hover:bg-[#f1f2f3]",
            ].join(" ")}
          >
            {item.label}

            {(item.children?.length || 0) > 0 && <ChevronDown size={12} />}
          </button>
        ))}
      </nav>

      {selectedRoot ? (
        <DesktopMegaMenu
          item={selectedRoot}
          menu={menu}
          selectedItemId={selectedItem?.id || null}
          onSelectItem={onSelectItem}
        />
      ) : (
        <div className="flex min-h-[360px] items-center justify-center p-6 text-center text-xs text-[#8c9196]">
          Add navigation items to display the preview.
        </div>
      )}
    </div>
  );
}

function DesktopMegaMenu({
  item,
  menu,
  selectedItemId,
  onSelectItem,
}: {
  item: NavigationItem;
  menu: NavigationMenu;

  selectedItemId: string | null;

  onSelectItem: (item: NavigationItem) => void;
}) {
  const children = item.children || [];

  const maxColumns = Math.max(Number(menu.settings?.maxColumns || 4), 1);

  const regularItems = children.filter(
    (child) => child.itemType !== "PROMOTION",
  );

  const promotions = children.filter((child) => child.itemType === "PROMOTION");

  const highestUsedColumn =
    regularItems.length > 0
      ? Math.max(
          ...regularItems.map((child) => Number(child.columnNumber || 1)),
          1,
        )
      : 1;

  const visibleColumnCount = Math.min(
    Math.max(highestUsedColumn, 1),
    maxColumns,
    4,
  );

  const columns = Array.from(
    {
      length: visibleColumnCount,
    },
    (_value, index) => index + 1,
  );

  const hasPromotion = promotions.length > 0;

  return (
    <div className="min-h-[390px] bg-white p-5">
      <div className="mb-5 border-b border-[#eceeef] pb-4">
        <p className="text-base font-semibold text-[#202223]">{item.label}</p>

        {item.description && (
          <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#6d7175]">
            {item.description}
          </p>
        )}
      </div>

      <div
        className={[
          "grid gap-6",
          hasPromotion ? "lg:grid-cols-[minmax(0,1fr)_220px]" : "grid-cols-1",
        ].join(" ")}
      >
        <div
          className="grid gap-x-6 gap-y-7"
          style={{
            gridTemplateColumns: `repeat(${visibleColumnCount}, minmax(0, 1fr))`,
          }}
        >
          {columns.map((columnNumber) => {
            const columnItems = regularItems.filter(
              (child) => Number(child.columnNumber || 1) === columnNumber,
            );

            return (
              <div key={columnNumber} className="min-w-0 space-y-5">
                {columnItems.map((child) => (
                  <MegaMenuEntry
                    key={child.id}
                    item={child}
                    selectedItemId={selectedItemId}
                    onSelectItem={onSelectItem}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {hasPromotion && (
          <aside className="space-y-4 border-l border-[#eceeef] pl-5">
            {promotions.slice(0, 2).map((promotion) => {
              const imageUrl = getNavigationAssetImageUrl(promotion.mediaAsset);

              const isSelected = selectedItemId === promotion.id;

              return (
                <div
                  key={promotion.id}
                  className={[
                    "overflow-hidden rounded-xl transition",
                    isSelected
                      ? "ring-2 ring-[#005bd3] ring-offset-2"
                      : "hover:-translate-y-0.5 hover:shadow-md",
                  ].join(" ")}
                >
                  <NavigationPromotionCard
                    item={promotion}
                    imageUrl={imageUrl}
                    interactive
                    onClick={() => onSelectItem(promotion)}
                  />
                </div>
              );
            })}
          </aside>
        )}
      </div>
    </div>
  );
}

function MegaMenuEntry({
  item,
  selectedItemId,
  onSelectItem,
}: {
  item: NavigationItem;

  selectedItemId: string | null;

  onSelectItem: (item: NavigationItem) => void;
}) {
  const children = item.children || [];

  const isHeading = item.itemType === "HEADING";

  if (isHeading) {
    return (
      <section className="min-w-0">
        <button
          type="button"
          onClick={() => onSelectItem(item)}
          className={[
            "mb-2 block w-full truncate border-b pb-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] transition",
            selectedItemId === item.id
              ? "border-[#005bd3] text-[#005bd3]"
              : "border-[#eceeef] text-[#5c5f62] hover:text-[#202223]",
          ].join(" ")}
        >
          {item.label}
        </button>

        {children.length > 0 ? (
          <div className="space-y-0.5">
            {children.map((child) => (
              <MegaMenuLink
                key={child.id}
                item={child}
                selectedItemId={selectedItemId}
                onSelectItem={onSelectItem}
              />
            ))}
          </div>
        ) : (
          <p className="py-1 text-[10px] text-[#b5b8bb]">No links added</p>
        )}
      </section>
    );
  }

  return (
    <div className="min-w-0">
      <MegaMenuLink
        item={item}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
        strong
      />

      {children.length > 0 && (
        <div className="mt-1 space-y-0.5 border-l border-[#eceeef] pl-2">
          {children.map((child) => (
            <MegaMenuLink
              key={child.id}
              item={child}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MegaMenuLink({
  item,
  selectedItemId,
  onSelectItem,
  strong = false,
}: {
  item: NavigationItem;

  selectedItemId: string | null;

  onSelectItem: (item: NavigationItem) => void;

  strong?: boolean;
}) {
  const isSelected = selectedItemId === item.id;

  return (
    <button
      type="button"
      onClick={() => onSelectItem(item)}
      className={[
        "group flex min-h-8 w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition",
        isSelected
          ? "bg-[#eef4ff] text-[#005bd3] ring-1 ring-inset ring-[#b4d3f8]"
          : "text-[#303030] hover:bg-[#f6f6f7] hover:text-[#005bd3]",
        strong ? "font-semibold" : "font-normal",
      ].join(" ")}
    >
      <span className="min-w-0 truncate">
        {item.label}

        {item.badgeText && (
          <span
            className="ml-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-semibold"
            style={{
              backgroundColor: item.badgeColor || "#fbeae5",

              color: item.badgeColor ? "#ffffff" : "#a23b2a",
            }}
          >
            {item.badgeText}
          </span>
        )}
      </span>

      <ChevronRight
        size={11}
        className={[
          "shrink-0 transition",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        ].join(" ")}
      />
    </button>
  );
}

function MobilePreview({ items, selectedItem, onSelectItem }: PreviewProps) {
  return (
    <div className="mx-auto max-w-[290px] overflow-hidden rounded-[28px] border-[6px] border-[#303030] bg-white shadow-lg">
      <div className="flex h-12 items-center justify-between border-b border-[#e1e3e5] px-4">
        <div className="flex items-center gap-2">
          <Menu size={17} />

          <span className="text-xs font-semibold">MyShops</span>
        </div>

        <div className="h-7 w-7 rounded-full bg-[#f1f2f3]" />
      </div>

      <div className="min-h-[540px] p-3">
        {items.map((item) => (
          <MobileNavigationItem
            key={item.id}
            item={item}
            selectedItemId={selectedItem?.id || null}
            level={0}
            onSelectItem={onSelectItem}
          />
        ))}
      </div>
    </div>
  );
}

function MobileNavigationItem({
  item,
  selectedItemId,
  level,
  onSelectItem,
}: {
  item: NavigationItem;

  selectedItemId: string | null;

  level: number;

  onSelectItem: (item: NavigationItem) => void;
}) {
  const children = item.children || [];

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelectItem(item)}
        className={[
          "flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition",
          selectedItemId === item.id
            ? "bg-[#303030] font-semibold text-white"
            : "hover:bg-[#f1f2f3]",
        ].join(" ")}
        style={{
          paddingLeft: 12 + level * 14,
        }}
      >
        <span className="truncate">{item.label}</span>

        {children.length > 0 && <ChevronRight size={14} />}
      </button>

      {children.length > 0 && (
        <div className="mt-0.5">
          {children.map((child) => (
            <MobileNavigationItem
              key={child.id}
              item={child}
              selectedItemId={selectedItemId}
              level={level + 1}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getSelectedRootItem(
  items: NavigationItem[],
  selectedItemId: string | null,
): NavigationItem | null {
  if (!selectedItemId) {
    return null;
  }

  for (const item of items) {
    if (item.id === selectedItemId) {
      return item;
    }

    if (containsItem(item, selectedItemId)) {
      return item;
    }
  }

  return null;
}

function containsItem(item: NavigationItem, itemId: string): boolean {
  return (item.children || []).some(
    (child) => child.id === itemId || containsItem(child, itemId),
  );
}