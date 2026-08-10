import {
    CheckCircle2,
    CircleSlash2,
  } from "lucide-react";
  
  interface StatusBadgeProps {
    isActive: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
    compact?: boolean;
  }
  
  export default function StatusBadge({
    isActive,
    activeLabel = "Active",
    inactiveLabel = "Inactive",
    compact = false,
  }: StatusBadgeProps) {
    return (
      <span
        className={[
          "inline-flex items-center rounded-full font-semibold",
          compact
            ? "gap-1 px-2 py-1 text-[11px]"
            : "gap-1.5 px-2.5 py-1.5 text-xs",
          isActive
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
            : "bg-[#f1f2f3] text-[#61666b] ring-1 ring-inset ring-[#d8dadd]",
        ].join(" ")}
      >
        {isActive ? (
          <CheckCircle2
            size={compact ? 12 : 14}
            aria-hidden="true"
          />
        ) : (
          <CircleSlash2
            size={compact ? 12 : 14}
            aria-hidden="true"
          />
        )}
  
        {isActive
          ? activeLabel
          : inactiveLabel}
      </span>
    );
  }