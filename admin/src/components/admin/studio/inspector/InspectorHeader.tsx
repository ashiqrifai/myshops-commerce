"use client";

import {
  X,
} from "lucide-react";

interface InspectorHeaderProps {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  onClose?: () => void;
}

export default function InspectorHeader({
  title,
  subtitle,
  badge,
  onClose,
}: InspectorHeaderProps) {
  return (
    <header className="border-b border-[#e1e3e5] bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-[#202223]">
              {title}
            </h2>

            {badge && (
              <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[10px] font-semibold text-[#005bd3]">
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6d7175]">
              {subtitle}
            </p>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#dfe3e8] bg-white text-[#5c5f62] transition hover:bg-[#f1f2f3] hover:text-[#202223]"
            aria-label="Close inspector"
            title="Close inspector"
          >
            <X
              size={15}
            />
          </button>
        )}
      </div>
    </header>
  );
}