"use client";

import { useMemo } from "react";
import { useGetAttributesQuery } from "@/store/api/attributeApi";
import type { Attribute } from "@/types/attribute";
import type { ProductAttributeValue } from "@/types/product";

export default function ProductSpecificationEditor({
  categoryIds,
  values,
  onChange,
}: {
  categoryIds: string[];
  values: ProductAttributeValue[];
  onChange: (values: ProductAttributeValue[]) => void;
}) {
  const { data, isLoading } = useGetAttributesQuery({
    page: 1,
    pageSize: 200,
    isActive: true,
    sortBy: "displayOrder",
    sortDirection: "ASC",
  });

  const attributes = useMemo(() => {
    if (!categoryIds.length) return [];
    return (data?.data || []).filter((attribute) =>
      (attribute.categoryAssignments || []).some(
        (assignment) =>
          categoryIds.includes(assignment.categoryId) &&
          assignment.isActive &&
          !assignment.isVariantDefining
      )
    );
  }, [data, categoryIds]);

  const setValue = (attribute: Attribute, patch: Partial<ProductAttributeValue>) => {
    const existing = values.find((item) => item.attributeId === attribute.id);
    const nextItem: ProductAttributeValue = {
      attributeId: attribute.id,
      optionId: null,
      textValue: null,
      numberValue: null,
      booleanValue: null,
      dateValue: null,
      jsonValue: null,
      displayValue: null,
      ...existing,
      ...patch,
    };

    onChange([
      ...values.filter((item) => item.attributeId !== attribute.id),
      nextItem,
    ]);
  };

  if (!categoryIds.length) {
    return <Empty text="Select a product category to load its specification fields." />;
  }

  if (isLoading) {
    return <p className="text-sm text-[#6d7175]">Loading specifications...</p>;
  }

  if (!attributes.length) {
    return <Empty text="No non-variant specifications are assigned to the selected categories." />;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {attributes.map((attribute) => (
        <Field
          key={attribute.id}
          attribute={attribute}
          value={values.find((item) => item.attributeId === attribute.id) || null}
          onChange={(patch) => setValue(attribute, patch)}
        />
      ))}
    </div>
  );
}

function Field({
  attribute,
  value,
  onChange,
}: {
  attribute: Attribute;
  value: ProductAttributeValue | null;
  onChange: (patch: Partial<ProductAttributeValue>) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {attribute.name}
        {attribute.unit ? ` (${attribute.unit})` : ""}
      </label>

      {attribute.inputType === "BOOLEAN" ? (
        <select
          value={value?.booleanValue === true ? "true" : value?.booleanValue === false ? "false" : ""}
          onChange={(event) =>
            onChange({
              booleanValue:
                event.target.value === "" ? null : event.target.value === "true",
              displayValue:
                event.target.value === "" ? null : event.target.value === "true" ? "Yes" : "No",
            })
          }
          className="admin-input"
        >
          <option value="">Not specified</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : attribute.inputType === "NUMBER" ? (
        <input
          type="number"
          value={value?.numberValue == null ? "" : String(value.numberValue)}
          onChange={(event) =>
            onChange({
              numberValue: event.target.value === "" ? null : Number(event.target.value),
              displayValue: event.target.value || null,
            })
          }
          className="admin-input"
        />
      ) : attribute.inputType === "DATE" ? (
        <input
          type="date"
          value={value?.dateValue || ""}
          onChange={(event) =>
            onChange({
              dateValue: event.target.value || null,
              displayValue: event.target.value || null,
            })
          }
          className="admin-input"
        />
      ) : ["SINGLE_SELECT", "COLOR_SWATCH"].includes(attribute.inputType) ? (
        <select
          value={value?.optionId || ""}
          onChange={(event) => {
            const option = (attribute.options || []).find(
              (item) => item.id === event.target.value
            );
            onChange({
              optionId: event.target.value || null,
              displayValue: option?.label || null,
              textValue: option?.value || null,
            });
          }}
          className="admin-input"
        >
          <option value="">Select a value</option>
          {(attribute.options || [])
            .filter((option) => option.isActive)
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
        </select>
      ) : (
        <textarea
          rows={attribute.inputType === "RICH_TEXT" ? 5 : 2}
          value={value?.textValue || ""}
          onChange={(event) =>
            onChange({
              textValue: event.target.value,
              displayValue: event.target.value || null,
            })
          }
          className="admin-input resize-y py-3"
        />
      )}

      {attribute.description && (
        <p className="mt-1.5 text-xs leading-5 text-[#6d7175]">{attribute.description}</p>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#babfc3] bg-[#fafbfb] p-6 text-center text-sm text-[#6d7175]">
      {text}
    </div>
  );
}
