"use client";

import {
  CheckCircle2,
  CircleOff,
  Filter,
  Layers3,
  Search,
  Shapes,
} from "lucide-react";

import type {
  AttributeFormValues,
} from "@/types/attribute";

interface AttributePreviewCardProps {
  values: AttributeFormValues;
  categoryNames: string[];
}

export default function AttributePreviewCard({
  values,
  categoryNames,
}: AttributePreviewCardProps) {
  return (
    <aside className="space-y-5">
      <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f2f3]">
            <Shapes size={19} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6d7175]">
              Live preview
            </p>

            <h2 className="mt-1 truncate text-lg font-semibold">
              {values.name || "Untitled attribute"}
            </h2>

            <p className="mt-1 font-mono text-xs text-[#8c9196]">
              {values.code || "ATTRIBUTE_CODE"}
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <PreviewRow
            label="Input type"
            value={formatEnum(values.inputType)}
          />

          <PreviewRow
            label="Data type"
            value={formatEnum(values.dataType)}
          />

          <PreviewRow
            label="Unit"
            value={values.unit || "—"}
          />

          <PreviewRow
            label="Display order"
            value={String(values.displayOrder)}
          />

          <PreviewRow
            label="Status"
            value={values.isActive ? "Active" : "Inactive"}
          />
        </dl>
      </section>

      {isSelectable(values.inputType) && (
        <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">
              Options
            </h2>

            <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-medium">
              {values.options.length}
            </span>
          </div>

          {values.options.length === 0 ? (
            <p className="mt-4 text-xs leading-5 text-[#6d7175]">
              Add options to preview them here.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {values.options
                .slice()
                .sort(
                  (a, b) =>
                    a.displayOrder - b.displayOrder
                )
                .slice(0, 8)
                .map((option) => (
                  <div
                    key={option.clientId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#e1e3e5] bg-[#fafbfb] px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {values.inputType ===
                        "COLOR_SWATCH" && (
                        <span
                          className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                          style={{
                            backgroundColor:
                              option.swatchValue ||
                              "#000000",
                          }}
                        />
                      )}

                      <span className="truncate text-sm font-medium">
                        {option.label || "Untitled option"}
                      </span>
                    </div>

                    {!option.isActive && (
                      <span className="text-[10px] font-medium uppercase text-[#a23b2a]">
                        Inactive
                      </span>
                    )}
                  </div>
                ))}

              {values.options.length > 8 && (
                <p className="text-center text-xs text-[#6d7175]">
                  +{values.options.length - 8} more
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">
          Behaviour
        </h2>

        <div className="mt-4 space-y-2">
          <BehaviourRow
            icon={<Layers3 size={15} />}
            label="Generates variants"
            enabled={values.isVariantDefining}
          />

          <BehaviourRow
            icon={<Filter size={15} />}
            label="Storefront filter"
            enabled={values.isFilterable}
          />

          <BehaviourRow
            icon={<Search size={15} />}
            label="Searchable"
            enabled={values.isSearchable}
          />

          <BehaviourRow
            icon={<CheckCircle2 size={15} />}
            label="Required"
            enabled={values.isRequired}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">
            Assigned categories
          </h2>

          <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-medium">
            {categoryNames.length}
          </span>
        </div>

        {categoryNames.length === 0 ? (
          <p className="mt-4 text-xs leading-5 text-[#6d7175]">
            This attribute is not assigned to a
            category yet.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {categoryNames.slice(0, 10).map((name) => (
              <span
                key={name}
                className="rounded-full border border-[#e1e3e5] bg-[#fafbfb] px-2.5 py-1 text-xs font-medium"
              >
                {name}
              </span>
            ))}

            {categoryNames.length > 10 && (
              <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-medium">
                +{categoryNames.length - 10}
              </span>
            )}
          </div>
        )}
      </section>
    </aside>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[#6d7175]">{label}</dt>
      <dd className="max-w-[170px] break-words text-right font-medium">
        {value}
      </dd>
    </div>
  );
}

function BehaviourRow({
  icon,
  label,
  enabled,
}: {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#e1e3e5] bg-[#fafbfb] px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[#6d7175]">{icon}</span>
        {label}
      </div>

      {enabled ? (
        <CheckCircle2
          size={17}
          className="text-[#2c6e49]"
        />
      ) : (
        <CircleOff
          size={17}
          className="text-[#8c9196]"
        />
      )}
    </div>
  );
}

function isSelectable(inputType: string): boolean {
  return [
    "SINGLE_SELECT",
    "MULTI_SELECT",
    "COLOR_SWATCH",
  ].includes(inputType);
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}
