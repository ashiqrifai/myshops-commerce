"use client";

import { useMemo } from "react";

import {
  CalendarRange,
  CircleDollarSign,
  Filter,
  Layers3,
  RotateCcw,
  ShoppingBag,
  ToggleLeft,
  X,
} from "lucide-react";

export type PriceListStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE";

export type PriceListValidityFilter =
  | "ALL"
  | "CURRENT"
  | "SCHEDULED"
  | "EXPIRED"
  | "UNLIMITED";

export interface PriceListFilterValues {
  status: PriceListStatusFilter;
  priceListType: string;
  channelCode: string;
  currencyCode: string;
  validity: PriceListValidityFilter;
}

export interface PriceListFilterOption {
  value: string;
  label: string;
}

interface PriceListFiltersProps {
  filters: PriceListFilterValues;

  onChange: (
    filters: PriceListFilterValues
  ) => void;

  typeOptions?: PriceListFilterOption[];
  channelOptions?: PriceListFilterOption[];
  currencyOptions?: PriceListFilterOption[];

  disabled?: boolean;
  className?: string;
  showResetButton?: boolean;
}

export const DEFAULT_PRICE_LIST_FILTERS: PriceListFilterValues = {
  status: "ALL",
  priceListType: "ALL",
  channelCode: "ALL",
  currencyCode: "ALL",
  validity: "ALL",
};

const DEFAULT_TYPE_OPTIONS: PriceListFilterOption[] = [
  {
    value: "ALL",
    label: "All types",
  },
  {
    value: "STANDARD",
    label: "Standard",
  },
  {
    value: "RETAIL",
    label: "Retail",
  },
  {
    value: "B2B",
    label: "B2B",
  },
  {
    value: "WHOLESALE",
    label: "Wholesale",
  },
  {
    value: "VIP",
    label: "VIP",
  },
  {
    value: "EMPLOYEE",
    label: "Employee",
  },
  {
    value: "PROMOTIONAL",
    label: "Promotional",
  },
];

const DEFAULT_CHANNEL_OPTIONS: PriceListFilterOption[] = [
  {
    value: "ALL",
    label: "All channels",
  },
  {
    value: "WEBSITE",
    label: "Website",
  },
  {
    value: "KIOSK",
    label: "Kiosk",
  },
  {
    value: "POS",
    label: "POS",
  },
  {
    value: "MOBILE_APP",
    label: "Mobile app",
  },
  {
    value: "MARKETPLACE",
    label: "Marketplace",
  },
];

const DEFAULT_CURRENCY_OPTIONS: PriceListFilterOption[] = [
  {
    value: "ALL",
    label: "All currencies",
  },
  {
    value: "AED",
    label: "AED",
  },
  {
    value: "USD",
    label: "USD",
  },
  {
    value: "SAR",
    label: "SAR",
  },
  {
    value: "OMR",
    label: "OMR",
  },
  {
    value: "BHD",
    label: "BHD",
  },
  {
    value: "QAR",
    label: "QAR",
  },
  {
    value: "KWD",
    label: "KWD",
  },
];

export default function PriceListFilters({
  filters,
  onChange,
  typeOptions = DEFAULT_TYPE_OPTIONS,
  channelOptions = DEFAULT_CHANNEL_OPTIONS,
  currencyOptions = DEFAULT_CURRENCY_OPTIONS,
  disabled = false,
  className = "",
  showResetButton = true,
}: PriceListFiltersProps) {
  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters]
  );

  const hasActiveFilters = activeFilterCount > 0;

  const updateFilter = <
    TKey extends keyof PriceListFilterValues
  >(
    key: TKey,
    value: PriceListFilterValues[TKey]
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    onChange({
      ...DEFAULT_PRICE_LIST_FILTERS,
    });
  };

  return (
    <section
      aria-label="Price list filters"
      className={[
        "rounded-xl border border-[#e1e3e5] bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 border-b border-[#e1e3e5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1f2f3] text-[#45484c]">
            <Filter
              size={17}
              aria-hidden="true"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#202223]">
                Filters
              </h2>

              {hasActiveFilters && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#303030] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-[#8c9196]">
              Narrow the price lists shown below
            </p>
          </div>
        </div>

        {showResetButton && (
          <button
            type="button"
            disabled={
              disabled ||
              !hasActiveFilters
            }
            onClick={handleReset}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium text-[#45484c] transition hover:border-[#8c9196] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw
              size={15}
              aria-hidden="true"
            />

            Reset filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
        <FilterSelect
          id="price-list-status-filter"
          label="Status"
          icon={ToggleLeft}
          value={filters.status}
          disabled={disabled}
          options={[
            {
              value: "ALL",
              label: "All statuses",
            },
            {
              value: "ACTIVE",
              label: "Active",
            },
            {
              value: "INACTIVE",
              label: "Inactive",
            },
          ]}
          onChange={(value) =>
            updateFilter(
              "status",
              value as PriceListStatusFilter
            )
          }
        />

        <FilterSelect
          id="price-list-type-filter"
          label="Price-list type"
          icon={Layers3}
          value={filters.priceListType}
          disabled={disabled}
          options={ensureAllOption(
            typeOptions,
            "All types"
          )}
          onChange={(value) =>
            updateFilter(
              "priceListType",
              value
            )
          }
        />

        <FilterSelect
          id="price-list-channel-filter"
          label="Channel"
          icon={ShoppingBag}
          value={filters.channelCode}
          disabled={disabled}
          options={ensureAllOption(
            channelOptions,
            "All channels"
          )}
          onChange={(value) =>
            updateFilter(
              "channelCode",
              value
            )
          }
        />

        <FilterSelect
          id="price-list-currency-filter"
          label="Currency"
          icon={CircleDollarSign}
          value={filters.currencyCode}
          disabled={disabled}
          options={ensureAllOption(
            currencyOptions,
            "All currencies"
          )}
          onChange={(value) =>
            updateFilter(
              "currencyCode",
              value
            )
          }
        />

        <FilterSelect
          id="price-list-validity-filter"
          label="Validity"
          icon={CalendarRange}
          value={filters.validity}
          disabled={disabled}
          options={[
            {
              value: "ALL",
              label: "All validity periods",
            },
            {
              value: "CURRENT",
              label: "Currently valid",
            },
            {
              value: "SCHEDULED",
              label: "Scheduled",
            },
            {
              value: "EXPIRED",
              label: "Expired",
            },
            {
              value: "UNLIMITED",
              label: "No date limit",
            },
          ]}
          onChange={(value) =>
            updateFilter(
              "validity",
              value as PriceListValidityFilter
            )
          }
        />
      </div>

      {hasActiveFilters && (
        <ActiveFilterChips
          filters={filters}
          typeOptions={typeOptions}
          channelOptions={channelOptions}
          currencyOptions={currencyOptions}
          disabled={disabled}
          onRemove={(key) => {
            updateFilter(
              key,
              getDefaultFilterValue(key)
            );
          }}
          onClear={handleReset}
        />
      )}
    </section>
  );
}

interface FilterSelectProps {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  options: PriceListFilterOption[];
  disabled: boolean;
  onChange: (value: string) => void;
}

function FilterSelect({
  id,
  label,
  icon: Icon,
  value,
  options,
  disabled,
  onChange,
}: FilterSelectProps) {
  return (
    <label
      htmlFor={id}
      className="block min-w-0"
    >
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[#6d7175]">
        <Icon
          size={13}
          aria-hidden="true"
        />

        {label}
      </span>

      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 w-full rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#303030] outline-none transition hover:border-[#8c9196] focus:border-[#303030] focus:ring-1 focus:ring-[#303030] disabled:cursor-not-allowed disabled:bg-[#f6f6f7] disabled:opacity-60"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ActiveFilterChipsProps {
  filters: PriceListFilterValues;
  typeOptions: PriceListFilterOption[];
  channelOptions: PriceListFilterOption[];
  currencyOptions: PriceListFilterOption[];
  disabled: boolean;

  onRemove: (
    key: keyof PriceListFilterValues
  ) => void;

  onClear: () => void;
}

function ActiveFilterChips({
  filters,
  typeOptions,
  channelOptions,
  currencyOptions,
  disabled,
  onRemove,
  onClear,
}: ActiveFilterChipsProps) {
  const chips = useMemo(
    () =>
      buildActiveFilterChips({
        filters,
        typeOptions,
        channelOptions,
        currencyOptions,
      }),
    [
      filters,
      typeOptions,
      channelOptions,
      currencyOptions,
    ]
  );

  return (
    <div className="flex flex-col gap-3 border-t border-[#e1e3e5] bg-[#fafafa] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#6d7175]">
          Applied:
        </span>

        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            disabled={disabled}
            onClick={() =>
              onRemove(chip.key)
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d8dadd] bg-white px-2.5 py-1 text-xs font-medium text-[#45484c] transition hover:border-[#8c9196] hover:bg-[#f1f2f3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-[#8c9196]">
              {chip.label}:
            </span>

            <span>
              {chip.value}
            </span>

            <X
              size={12}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onClear}
        className="self-start text-xs font-semibold text-[#45484c] underline-offset-4 transition hover:text-[#202223] hover:underline disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
      >
        Clear all
      </button>
    </div>
  );
}

interface ActiveFilterChip {
  key: keyof PriceListFilterValues;
  label: string;
  value: string;
}

function buildActiveFilterChips({
  filters,
  typeOptions,
  channelOptions,
  currencyOptions,
}: {
  filters: PriceListFilterValues;
  typeOptions: PriceListFilterOption[];
  channelOptions: PriceListFilterOption[];
  currencyOptions: PriceListFilterOption[];
}) {
  const chips: ActiveFilterChip[] = [];

  if (filters.status !== "ALL") {
    chips.push({
      key: "status",
      label: "Status",
      value: formatFilterValue(
        filters.status
      ),
    });
  }

  if (filters.priceListType !== "ALL") {
    chips.push({
      key: "priceListType",
      label: "Type",
      value: findOptionLabel(
        typeOptions,
        filters.priceListType
      ),
    });
  }

  if (filters.channelCode !== "ALL") {
    chips.push({
      key: "channelCode",
      label: "Channel",
      value: findOptionLabel(
        channelOptions,
        filters.channelCode
      ),
    });
  }

  if (filters.currencyCode !== "ALL") {
    chips.push({
      key: "currencyCode",
      label: "Currency",
      value: findOptionLabel(
        currencyOptions,
        filters.currencyCode
      ),
    });
  }

  if (filters.validity !== "ALL") {
    chips.push({
      key: "validity",
      label: "Validity",
      value: getValidityLabel(
        filters.validity
      ),
    });
  }

  return chips;
}

function countActiveFilters(
  filters: PriceListFilterValues
) {
  return Object.entries(filters).filter(
    ([, value]) => value !== "ALL"
  ).length;
}

function getDefaultFilterValue<
  TKey extends keyof PriceListFilterValues
>(
  key: TKey
): PriceListFilterValues[TKey] {
  return DEFAULT_PRICE_LIST_FILTERS[
    key
  ];
}

function ensureAllOption(
  options: PriceListFilterOption[],
  allLabel: string
) {
  const containsAll = options.some(
    (option) => option.value === "ALL"
  );

  if (containsAll) {
    return options;
  }

  return [
    {
      value: "ALL",
      label: allLabel,
    },
    ...options,
  ];
}

function findOptionLabel(
  options: PriceListFilterOption[],
  value: string
) {
  return (
    options.find(
      (option) => option.value === value
    )?.label || formatFilterValue(value)
  );
}

function getValidityLabel(
  value: PriceListValidityFilter
) {
  switch (value) {
    case "CURRENT":
      return "Currently valid";

    case "SCHEDULED":
      return "Scheduled";

    case "EXPIRED":
      return "Expired";

    case "UNLIMITED":
      return "No date limit";

    default:
      return "All";
  }
}

function formatFilterValue(
  value: string
) {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}