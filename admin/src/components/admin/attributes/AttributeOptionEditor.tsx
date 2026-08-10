"use client";

import {
  ArrowDown,
  ArrowUp,
  CirclePlus,
  GripVertical,
  Palette,
  Trash2,
} from "lucide-react";

import type {
  AttributeInputType,
  AttributeOptionFormValue,
} from "@/types/attribute";

interface AttributeOptionEditorProps {
  inputType: AttributeInputType;
  options: AttributeOptionFormValue[];
  onChange: (options: AttributeOptionFormValue[]) => void;
}

export default function AttributeOptionEditor({
  inputType,
  options,
  onChange,
}: AttributeOptionEditorProps) {
  const showSwatch =
    inputType === "COLOR_SWATCH";

  const addOption = () => {
    const nextOrder =
      options.length === 0
        ? 0
        : Math.max(
            ...options.map(
              (option) => option.displayOrder
            )
          ) + 1;

    onChange([
      ...options,
      {
        clientId: createClientId(),
        label: "",
        value: "",
        swatchValue: showSwatch ? "#000000" : null,
        displayOrder: nextOrder,
        isActive: true,
      },
    ]);
  };

  const updateOption = <
    K extends keyof AttributeOptionFormValue
  >(
    clientId: string,
    field: K,
    value: AttributeOptionFormValue[K]
  ) => {
    onChange(
      options.map((option) =>
        option.clientId === clientId
          ? {
              ...option,
              [field]: value,
            }
          : option
      )
    );
  };

  const removeOption = (clientId: string) => {
    onChange(
      options
        .filter(
          (option) => option.clientId !== clientId
        )
        .map((option, index) => ({
          ...option,
          displayOrder: index,
        }))
    );
  };

  const moveOption = (
    clientId: string,
    direction: "UP" | "DOWN"
  ) => {
    const index = options.findIndex(
      (option) => option.clientId === clientId
    );

    if (index < 0) {
      return;
    }

    const targetIndex =
      direction === "UP" ? index - 1 : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= options.length
    ) {
      return;
    }

    const next = [...options];
    [next[index], next[targetIndex]] = [
      next[targetIndex],
      next[index],
    ];

    onChange(
      next.map((option, optionIndex) => ({
        ...option,
        displayOrder: optionIndex,
      }))
    );
  };

  const handleLabelChange = (
    option: AttributeOptionFormValue,
    label: string
  ) => {
    const valueWasGenerated =
      !option.value ||
      option.value === generateOptionValue(option.label);

    updateOption(option.clientId, "label", label);

    if (valueWasGenerated) {
      updateOption(
        option.clientId,
        "value",
        generateOptionValue(label)
      );
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">
            Attribute options
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#6d7175]">
            These values will be available when
            assigning the attribute to products.
          </p>
        </div>

        <button
          type="button"
          onClick={addOption}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
        >
          <CirclePlus size={15} />
          Add option
        </button>
      </div>

      {options.length === 0 ? (
        <button
          type="button"
          onClick={addOption}
          className="mt-4 flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#babfc3] bg-[#fafbfb] p-5 text-center hover:bg-[#f6f6f7]"
        >
          {showSwatch ? (
            <Palette
              size={25}
              className="text-[#6d7175]"
            />
          ) : (
            <CirclePlus
              size={25}
              className="text-[#6d7175]"
            />
          )}

          <span className="mt-3 text-sm font-semibold">
            Add the first option
          </span>

          <span className="mt-1 text-xs text-[#6d7175]">
            Examples: Black, 128GB, XL
          </span>
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          {options.map((option, index) => (
            <div
              key={option.clientId}
              className="rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4"
            >
              <div className="grid gap-3 lg:grid-cols-[34px_minmax(160px,1fr)_minmax(160px,1fr)_110px_92px_72px] lg:items-end">
                <div className="hidden h-10 items-center justify-center text-[#8c9196] lg:flex">
                  <GripVertical size={18} />
                </div>

                <FormField label="Label">
                  <input
                    value={option.label}
                    onChange={(event) =>
                      handleLabelChange(
                        option,
                        event.target.value
                      )
                    }
                    className="admin-input"
                    placeholder="Black"
                  />
                </FormField>

                <FormField label="Stored value">
                  <input
                    value={option.value}
                    onChange={(event) =>
                      updateOption(
                        option.clientId,
                        "value",
                        generateOptionValue(
                          event.target.value
                        )
                      )
                    }
                    className="admin-input font-mono text-xs"
                    placeholder="black"
                  />
                </FormField>

                {showSwatch ? (
                  <FormField label="Colour">
                    <div className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-2">
                      <input
                        type="color"
                        value={
                          option.swatchValue || "#000000"
                        }
                        onChange={(event) =>
                          updateOption(
                            option.clientId,
                            "swatchValue",
                            event.target.value
                          )
                        }
                        className="h-7 w-8 cursor-pointer border-0 bg-transparent p-0"
                      />

                      <span className="truncate font-mono text-[11px] text-[#6d7175]">
                        {option.swatchValue || "—"}
                      </span>
                    </div>
                  </FormField>
                ) : (
                  <FormField label="Order">
                    <input
                      type="number"
                      min={0}
                      value={option.displayOrder}
                      onChange={(event) =>
                        updateOption(
                          option.clientId,
                          "displayOrder",
                          Number(event.target.value)
                        )
                      }
                      className="admin-input"
                    />
                  </FormField>
                )}

                <FormField label="Active">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={option.isActive}
                    onClick={() =>
                      updateOption(
                        option.clientId,
                        "isActive",
                        !option.isActive
                      )
                    }
                    className={[
                      "relative h-6 w-11 rounded-full transition",
                      option.isActive
                        ? "bg-[#303030]"
                        : "bg-[#babfc3]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                        option.isActive
                          ? "left-[22px]"
                          : "left-0.5",
                      ].join(" ")}
                    />
                  </button>
                </FormField>

                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      moveOption(option.clientId, "UP")
                    }
                    disabled={index === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white hover:bg-[#f6f6f7] disabled:opacity-30"
                    aria-label="Move option up"
                  >
                    <ArrowUp size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveOption(option.clientId, "DOWN")
                    }
                    disabled={index === options.length - 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white hover:bg-[#f6f6f7] disabled:opacity-30"
                    aria-label="Move option down"
                  >
                    <ArrowDown size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeOption(option.clientId)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#f0b9ad] bg-white text-[#a23b2a] hover:bg-[#fbeae5]"
                    aria-label="Remove option"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {showSwatch && (
                <div className="mt-3 grid gap-3 border-t border-[#e1e3e5] pt-3 sm:grid-cols-[120px_1fr]">
                  <FormField label="Order">
                    <input
                      type="number"
                      min={0}
                      value={option.displayOrder}
                      onChange={(event) =>
                        updateOption(
                          option.clientId,
                          "displayOrder",
                          Number(event.target.value)
                        )
                      }
                      className="admin-input"
                    />
                  </FormField>

                  <div className="flex items-end">
                    <div className="flex h-10 items-center gap-3 rounded-lg border border-[#e1e3e5] bg-white px-3">
                      <span
                        className="h-6 w-6 rounded-full border border-black/10"
                        style={{
                          backgroundColor:
                            option.swatchValue || "#000000",
                        }}
                      />

                      <span className="text-sm font-medium">
                        {option.label || "Colour preview"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#5c5f62]">
        {label}
      </label>
      {children}
    </div>
  );
}

function generateOptionValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function createClientId(): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}
