"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  FileText,
  Layers3,
  LoaderCircle,
  Save,
  Settings2,
  Shapes,
} from "lucide-react";

import AttributeOptionEditor from "./AttributeOptionEditor";
import AttributePreviewCard from "./AttributePreviewCard";
import CategoryAssignmentPanel from "./CategoryAssignmentPanel";

import type {
  AttributeDataType,
  AttributeFormValues,
  AttributeInputType,
} from "@/types/attribute";

interface AttributeFormProps {
  initialValues?: Partial<AttributeFormValues>;
  isSaving: boolean;
  submitLabel?: string;
  categoryNames?: string[];
  onSubmit: (
    values: AttributeFormValues
  ) => Promise<void> | void;
}

const defaultValues: AttributeFormValues = {
  name: "",
  code: "",
  description: null,
  inputType: "TEXT",
  dataType: "STRING",
  unit: null,
  isVariantDefining: false,
  isFilterable: false,
  isSearchable: false,
  isComparable: false,
  isRequired: false,
  displayOrder: 0,
  isActive: true,
  options: [],
  categoryAssignments: [],
};

const selectableTypes: AttributeInputType[] = [
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "COLOR_SWATCH",
];

export default function AttributeForm({
  initialValues,
  isSaving,
  submitLabel = "Save attribute",
  categoryNames = [],
  onSubmit,
}: AttributeFormProps) {
  const [values, setValues] =
    useState<AttributeFormValues>({
      ...defaultValues,
      ...initialValues,
      options: initialValues?.options || [],
      categoryAssignments:
        initialValues?.categoryAssignments || [],
    });

  const [codeWasEdited, setCodeWasEdited] =
    useState(Boolean(initialValues?.code));

  useEffect(() => {
    setValues({
      ...defaultValues,
      ...initialValues,
      options: initialValues?.options || [],
      categoryAssignments:
        initialValues?.categoryAssignments || [],
    });

    setCodeWasEdited(Boolean(initialValues?.code));
  }, [initialValues]);

  const isSelectable = selectableTypes.includes(
    values.inputType
  );

  const setField = <
    K extends keyof AttributeFormValues
  >(
    field: K,
    value: AttributeFormValues[K]
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleNameChange = (name: string) => {
    setField("name", name);

    if (!codeWasEdited) {
      setField("code", generateCode(name));
    }
  };

  const handleInputTypeChange = (
    inputType: AttributeInputType
  ) => {
    const nextDataType =
      getRecommendedDataType(inputType);

    setValues((current) => ({
      ...current,
      inputType,
      dataType: nextDataType,
      options: selectableTypes.includes(inputType)
        ? current.options
        : [],
      isVariantDefining:
        selectableTypes.includes(inputType)
          ? current.isVariantDefining
          : false,
    }));
  };

  const validationError = useMemo(() => {
    if (!values.name.trim()) {
      return "Attribute name is required.";
    }

    if (!values.code.trim()) {
      return "Attribute code is required.";
    }

    if (
      isSelectable &&
      values.options.length === 0
    ) {
      return "Selectable attributes require at least one option.";
    }

    if (
      isSelectable &&
      values.options.some(
        (option) =>
          !option.label.trim() ||
          !option.value.trim()
      )
    ) {
      return "Every option requires a label and stored value.";
    }

    const optionValues = values.options.map(
      (option) => option.value.trim().toLowerCase()
    );

    if (
      new Set(optionValues).size !== optionValues.length
    ) {
      return "Option stored values must be unique.";
    }

    return null;
  }, [values, isSelectable]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (validationError) {
      window.alert(validationError);
      return;
    }

    await onSubmit({
      ...values,
      name: values.name.trim(),
      code: generateCode(values.code),
      description:
        values.description?.trim() || null,
      unit: values.unit?.trim() || null,
      displayOrder: Number(values.displayOrder || 0),
      options: isSelectable
        ? values.options.map((option, index) => ({
            ...option,
            label: option.label.trim(),
            value: generateOptionValue(
              option.value || option.label
            ),
            swatchValue:
              values.inputType === "COLOR_SWATCH"
                ? option.swatchValue?.trim() ||
                  "#000000"
                : null,
            displayOrder: Number(
              option.displayOrder ?? index
            ),
          }))
        : [],
      categoryAssignments:
        values.categoryAssignments.map(
          (assignment, index) => ({
            ...assignment,
            displayOrder: Number(
              assignment.displayOrder ?? index
            ),
          })
        ),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8"
    >
      <header className="mb-6">
        <Link
          href="/admin/attributes"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6d7175] hover:text-[#303030]"
        >
          <ArrowLeft size={16} />
          Attributes
        </Link>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {initialValues
                ? "Edit attribute"
                : "Create attribute"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
              Configure specifications, storefront
              filters and variant-generating product
              options.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {isSaving ? "Saving..." : submitLabel}
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <FormCard
            icon={<Shapes size={18} />}
            title="Attribute identity"
            description="The internal name and code used throughout the catalogue."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="Attribute name"
                required
              >
                <input
                  value={values.name}
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  placeholder="Color"
                  required
                />
              </FormField>

              <FormField
                label="Attribute code"
                required
                hint="Unique internal code. Uppercase is recommended."
              >
                <input
                  value={values.code}
                  onChange={(event) => {
                    setCodeWasEdited(true);
                    setField(
                      "code",
                      generateCode(event.target.value)
                    );
                  }}
                  className="admin-input font-mono"
                  placeholder="COLOR"
                  required
                />
              </FormField>
            </div>

            <FormField label="Description">
              <textarea
                value={values.description || ""}
                onChange={(event) =>
                  setField(
                    "description",
                    event.target.value
                  )
                }
                rows={5}
                className="admin-input min-h-[130px] resize-y py-3"
                placeholder="Available product colours."
              />
            </FormField>
          </FormCard>

          <FormCard
            icon={<FileText size={18} />}
            title="Data configuration"
            description="Choose how the value is entered, stored and displayed."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <FormField
                label="Input type"
                required
              >
                <select
                  value={values.inputType}
                  onChange={(event) =>
                    handleInputTypeChange(
                      event.target
                        .value as AttributeInputType
                    )
                  }
                  className="admin-input"
                >
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                  <option value="BOOLEAN">
                    Boolean
                  </option>
                  <option value="SINGLE_SELECT">
                    Single select
                  </option>
                  <option value="MULTI_SELECT">
                    Multi select
                  </option>
                  <option value="COLOR_SWATCH">
                    Color swatch
                  </option>
                  <option value="DATE">Date</option>
                  <option value="RICH_TEXT">
                    Rich text
                  </option>
                </select>
              </FormField>

              <FormField
                label="Data type"
                required
              >
                <select
                  value={values.dataType}
                  onChange={(event) =>
                    setField(
                      "dataType",
                      event.target
                        .value as AttributeDataType
                    )
                  }
                  className="admin-input"
                >
                  <option value="STRING">
                    String
                  </option>
                  <option value="NUMBER">
                    Number
                  </option>
                  <option value="BOOLEAN">
                    Boolean
                  </option>
                  <option value="DATE">Date</option>
                  <option value="JSON">JSON</option>
                </select>
              </FormField>

              <FormField
                label="Unit"
                hint="Optional: GB, kg, inch, W"
              >
                <input
                  value={values.unit || ""}
                  onChange={(event) =>
                    setField("unit", event.target.value)
                  }
                  className="admin-input"
                  placeholder="GB"
                />
              </FormField>
            </div>

            <div className="rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                Recommended use
              </p>

              <p className="mt-2 text-sm leading-6">
                {getInputTypeHelp(values.inputType)}
              </p>
            </div>
          </FormCard>

          {isSelectable && (
            <FormCard
              icon={<Layers3 size={18} />}
              title="Attribute options"
              description="Create the selectable values that products and variants can use."
            >
              <AttributeOptionEditor
                inputType={values.inputType}
                options={values.options}
                onChange={(options) =>
                  setField("options", options)
                }
              />
            </FormCard>
          )}

          <FormCard
            icon={<Settings2 size={18} />}
            title="Category availability"
            description="Assign this attribute to the relevant catalogue categories."
          >
            <CategoryAssignmentPanel
              assignments={
                values.categoryAssignments
              }
              defaultRequired={values.isRequired}
              defaultFilterable={values.isFilterable}
              defaultVariantDefining={
                values.isVariantDefining
              }
              onChange={(categoryAssignments) =>
                setField(
                  "categoryAssignments",
                  categoryAssignments
                )
              }
            />
          </FormCard>
        </div>

        <aside className="space-y-5">
          <FormCard
            icon={<Settings2 size={18} />}
            title="Attribute behaviour"
            description="Control how products, filters and comparisons use this attribute."
          >
            <ToggleField
              label="Variant defining"
              description="Use values to generate separate product SKUs."
              checked={values.isVariantDefining}
              disabled={!isSelectable}
              onChange={(checked) =>
                setField(
                  "isVariantDefining",
                  checked
                )
              }
            />

            <ToggleField
              label="Required"
              description="Require a value when applicable."
              checked={values.isRequired}
              onChange={(checked) =>
                setField("isRequired", checked)
              }
            />

            <ToggleField
              label="Filterable"
              description="Expose this attribute in storefront and kiosk filters."
              checked={values.isFilterable}
              onChange={(checked) =>
                setField("isFilterable", checked)
              }
            />

            <ToggleField
              label="Searchable"
              description="Include values in product search indexing."
              checked={values.isSearchable}
              onChange={(checked) =>
                setField("isSearchable", checked)
              }
            />

            <ToggleField
              label="Comparable"
              description="Show the value in product comparison tables."
              checked={values.isComparable}
              onChange={(checked) =>
                setField("isComparable", checked)
              }
            />

            <ToggleField
              label="Active"
              description="Allow products and categories to use this attribute."
              checked={values.isActive}
              onChange={(checked) =>
                setField("isActive", checked)
              }
            />

            <FormField
              label="Display order"
              hint="Lower values display first."
            >
              <input
                type="number"
                min={0}
                value={values.displayOrder}
                onChange={(event) =>
                  setField(
                    "displayOrder",
                    Number(event.target.value)
                  )
                }
                className="admin-input"
              />
            </FormField>
          </FormCard>

          <AttributePreviewCard
            values={values}
            categoryNames={categoryNames}
          />

          {validationError && (
            <div className="rounded-xl border border-[#f0b9ad] bg-[#fbeae5] p-4 text-sm text-[#a23b2a]">
              {validationError}
            </div>
          )}

          <div className="sticky bottom-4 rounded-2xl border border-[#e1e3e5] bg-white p-4 shadow-lg">
            <button
              type="submit"
              disabled={isSaving}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {isSaving ? "Saving..." : submitLabel}
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}

function FormCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 text-[#5c5f62]">
            {icon}
          </div>
        )}

        <div>
          <h2 className="text-base font-semibold">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm leading-6 text-[#6d7175]">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {children}
      </div>
    </section>
  );
}

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}

        {required && (
          <span className="ml-1 text-[#d72c0d]">
            *
          </span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-xs text-[#6d7175]">
          {hint}
        </p>
      )}
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-4 rounded-xl border border-[#e1e3e5] p-4",
        disabled
          ? "bg-[#f6f6f7] opacity-60"
          : "hover:bg-[#fafbfb]",
      ].join(" ")}
    >
      <div>
        <p className="text-sm font-medium">{label}</p>

        <p className="mt-1 text-xs leading-5 text-[#6d7175]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-[#303030]" : "bg-[#babfc3]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "left-[22px]" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function getRecommendedDataType(
  inputType: AttributeInputType
): AttributeDataType {
  switch (inputType) {
    case "NUMBER":
      return "NUMBER";
    case "BOOLEAN":
      return "BOOLEAN";
    case "DATE":
      return "DATE";
    case "MULTI_SELECT":
      return "JSON";
    default:
      return "STRING";
  }
}

function getInputTypeHelp(
  inputType: AttributeInputType
): string {
  switch (inputType) {
    case "TEXT":
      return "Best for short specifications such as processor model, operating system or material.";
    case "NUMBER":
      return "Best for measurable values such as capacity, weight, wattage, dimensions or screen size.";
    case "BOOLEAN":
      return "Best for yes/no specifications such as waterproof, wireless charging or smart enabled.";
    case "SINGLE_SELECT":
      return "The product chooses one value from a controlled list, such as storage or warranty period.";
    case "MULTI_SELECT":
      return "The product can use several values, such as supported connectivity standards or included features.";
    case "COLOR_SWATCH":
      return "A controlled colour list with visual swatches. Ideal for product variant generation and filters.";
    case "DATE":
      return "Best for release dates, warranty expiry templates or other date-based product information.";
    case "RICH_TEXT":
      return "Best for longer formatted specification content that may include paragraphs or lists.";
  }
}

function generateCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
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
