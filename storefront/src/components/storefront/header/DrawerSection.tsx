"use client";

import type {
  NavigationItem,
} from "./NavigationDrawer.types";

import {
  getItemChildren,
  getItemLabel,
} from "./navigationDrawer.utils";

import DrawerMenuItem from "./DrawerMenuItem";

interface DrawerSectionProps {
  section: NavigationItem;
  open: boolean;
  onOpenChildren: (
    item: NavigationItem
  ) => void;
  onNavigate: () => void;
}

export default function DrawerSection({
  section,
  open,
  onOpenChildren,
  onNavigate,
}: DrawerSectionProps) {
  const children =
    getItemChildren(section);

  if (!children.length) {
    return (
      <div className="border-b border-slate-200 py-2 last:border-b-0">
        <DrawerMenuItem
          item={section}
          open={open}
          onOpenChildren={
            onOpenChildren
          }
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  return (
    <section className="border-b border-slate-200 py-4 last:border-b-0">
      <h3 className="px-6 pb-2 text-lg font-extrabold text-slate-950">
        {getItemLabel(section)}
      </h3>

      <nav
        aria-label={getItemLabel(
          section
        )}
      >
        {children.map((item) => (
          <DrawerMenuItem
            key={item.id}
            item={item}
            open={open}
            onOpenChildren={
              onOpenChildren
            }
            onNavigate={
              onNavigate
            }
          />
        ))}
      </nav>
    </section>
  );
}
