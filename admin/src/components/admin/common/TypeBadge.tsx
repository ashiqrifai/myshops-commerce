import type {
    LucideIcon,
  } from "lucide-react";
  
  import {
    BadgePercent,
    BriefcaseBusiness,
    Building2,
    CircleDollarSign,
    Crown,
    PackageCheck,
    ShoppingBag,
    Sparkles,
    Star,
    Tag,
    UserRoundCheck,
    UsersRound,
  } from "lucide-react";
  
  interface BadgeStyle {
    label: string;
    className: string;
    icon: LucideIcon;
  }
  
  const TYPE_STYLES: Record<
    string,
    BadgeStyle
  > = {
    STANDARD: {
      label: "Standard",
      className:
        "bg-slate-50 text-slate-700 ring-slate-200",
      icon: Tag,
    },
  
    RETAIL: {
      label: "Retail",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-200",
      icon: ShoppingBag,
    },
  
    B2B: {
      label: "B2B",
      className:
        "bg-blue-50 text-blue-700 ring-blue-200",
      icon: BriefcaseBusiness,
    },
  
    WHOLESALE: {
      label: "Wholesale",
      className:
        "bg-cyan-50 text-cyan-700 ring-cyan-200",
      icon: PackageCheck,
    },
  
    VIP: {
      label: "VIP",
      className:
        "bg-violet-50 text-violet-700 ring-violet-200",
      icon: Crown,
    },
  
    EMPLOYEE: {
      label: "Employee",
      className:
        "bg-indigo-50 text-indigo-700 ring-indigo-200",
      icon: UserRoundCheck,
    },
  
    PROMOTIONAL: {
      label: "Promotional",
      className:
        "bg-amber-50 text-amber-700 ring-amber-200",
      icon: BadgePercent,
    },
  
    FEATURED: {
      label: "Featured",
      className:
        "bg-yellow-50 text-yellow-700 ring-yellow-200",
      icon: Star,
    },
  
    CUSTOMER: {
      label: "Customer",
      className:
        "bg-blue-50 text-blue-700 ring-blue-200",
      icon: UsersRound,
    },
  
    SUPPLIER: {
      label: "Supplier",
      className:
        "bg-orange-50 text-orange-700 ring-orange-200",
      icon: Building2,
    },
  
    PREMIUM: {
      label: "Premium",
      className:
        "bg-purple-50 text-purple-700 ring-purple-200",
      icon: Sparkles,
    },
  
    PRICING: {
      label: "Pricing",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-200",
      icon: CircleDollarSign,
    },
  };
  
  interface TypeBadgeProps {
    type: string;
    label?: string;
    compact?: boolean;
    showIcon?: boolean;
  }
  
  export default function TypeBadge({
    type,
    label,
    compact = false,
    showIcon = true,
  }: TypeBadgeProps) {
    const normalizedType =
      String(type || "")
        .trim()
        .toUpperCase();
  
    const configuration =
      TYPE_STYLES[
        normalizedType
      ] || {
        label:
          formatLabel(
            normalizedType
          ),
        className:
          "bg-[#f1f2f3] text-[#61666b] ring-[#d8dadd]",
        icon: Tag,
      };
  
    const Icon =
      configuration.icon;
  
    return (
      <span
        className={[
          "inline-flex items-center rounded-full font-semibold ring-1 ring-inset",
          configuration.className,
          compact
            ? "gap-1 px-2 py-1 text-[11px]"
            : "gap-1.5 px-2.5 py-1.5 text-xs",
        ].join(" ")}
      >
        {showIcon && (
          <Icon
            size={
              compact
                ? 12
                : 14
            }
            aria-hidden="true"
          />
        )}
  
        {label ||
          configuration.label}
      </span>
    );
  }
  
  function formatLabel(
    value: string
  ) {
    if (!value) {
      return "Unknown";
    }
  
    return value
      .toLowerCase()
      .replace(
        /[_-]+/g,
        " "
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }