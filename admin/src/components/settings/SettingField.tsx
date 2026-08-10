"use client";

import type {
  SettingOption,
  SystemSetting,
} from "@/types/settings";

interface SettingFieldProps {
  setting: SystemSetting;
  value: unknown;
  onChange: (value: unknown) => void;
}

const normalizeOptions = (
  options:
    | SettingOption[]
    | string[]
    | null
    | undefined
): SettingOption[] => {
  if (!options) {
    return [];
  }

  return options.map((option) => {
    if (typeof option === "string") {
      return {
        label: option,
        value: option,
      };
    }

    return option;
  });
};

export default function SettingField({
  setting,
  value,
  onChange,
}: SettingFieldProps) {
  const disabled = !setting.isEditable;

  if (setting.dataType === "BOOLEAN") {
    const checked = Boolean(value);

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          onChange(!checked)
        }
        className={[
          "relative h-6 w-11 rounded-full transition",
          checked
            ? "bg-[#303030]"
            : "bg-[#c9cccf]",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "",
        ].join(" ")}
        aria-pressed={checked}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked
              ? "left-[22px]"
              : "left-0.5",
          ].join(" ")}
        />
      </button>
    );
  }

  if (setting.dataType === "COLOR") {
    const colorValue =
      typeof value === "string"
        ? value
        : "#000000";

    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={colorValue.slice(0, 7)}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-10 w-12 cursor-pointer rounded-lg border border-[#8c9196] bg-white p-1 disabled:cursor-not-allowed"
        />

        <input
          type="text"
          value={colorValue}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="admin-input max-w-[150px] font-mono uppercase"
          maxLength={9}
        />
      </div>
    );
  }

  if (setting.dataType === "NUMBER") {
    return (
      <input
        type="number"
        value={
          typeof value === "number"
            ? value
            : ""
        }
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value === ""
              ? ""
              : Number(event.target.value)
          )
        }
        className="admin-input max-w-[180px]"
      />
    );
  }

  if (setting.dataType === "SELECT") {
    const options = normalizeOptions(
      setting.options
    );

    return (
      <select
        value={
          typeof value === "string"
            ? value
            : ""
        }
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="admin-input max-w-[280px]"
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
    );
  }

  if (
    setting.dataType === "IMAGE"
  ) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={
            typeof value === "string"
              ? value
              : ""
          }
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="admin-input"
          placeholder="Image URL"
        />

        <p className="text-xs text-[#6d7175]">
          Media Library upload will be added
          when we build the CMS media module.
        </p>
      </div>
    );
  }

  return (
    <input
      type={
        setting.dataType === "EMAIL"
          ? "email"
          : setting.dataType === "URL"
            ? "url"
            : "text"
      }
      value={
        typeof value === "string"
          ? value
          : ""
      }
      disabled={disabled}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="admin-input"
      required={setting.isRequired}
    />
  );
}