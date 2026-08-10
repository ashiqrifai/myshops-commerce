"use client";

import type {
  ReactNode,
} from "react";

interface InspectorSectionProps {
  title: string;
  description?: string | null;
  children: ReactNode;
  action?: ReactNode;
}

export default function InspectorSection({
  title,
  description,
  children,
  action,
}: InspectorSectionProps) {
  return (
    <section className="rounded-2xl border border-[#e1e3e5] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs leading-5 text-[#6d7175]">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}