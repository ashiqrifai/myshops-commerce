"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
  Save,
} from "lucide-react";

import type {
  NavigationChannel,
  NavigationMenuFormValues,
  NavigationMenuType,
} from "@/types/navigation";

interface NavigationMenuFormProps {
  initialValues?:
    Partial<NavigationMenuFormValues>;

  submitLabel?: string;

  isSubmitting?: boolean;

  onSubmit: (
    values:
      NavigationMenuFormValues
  ) => Promise<void>;
}

const defaultValues:
  NavigationMenuFormValues = {
  name: "",
  code: "",

  channel:
    "WEBSITE",

  menuType:
    "MEGA_MENU",

  description:
    null,

  settings: {
    desktopEnabled:
      true,

    mobileEnabled:
      true,

    maxColumns:
      4,
  },
};

export default function NavigationMenuForm({
  initialValues,
  submitLabel =
    "Save menu",
  isSubmitting =
    false,
  onSubmit,
}: NavigationMenuFormProps) {
  const [
    values,
    setValues,
  ] =
    useState<NavigationMenuFormValues>({
      ...defaultValues,
      ...initialValues,

      settings: {
        ...defaultValues.settings,

        ...(initialValues?.settings ||
          {}),
      },
    });

  useEffect(() => {
    setValues({
      ...defaultValues,
      ...initialValues,

      settings: {
        ...defaultValues.settings,

        ...(initialValues?.settings ||
          {}),
      },
    });
  }, [initialValues]);

  const setField = <
    K extends keyof NavigationMenuFormValues,
  >(
    field: K,
    value:
      NavigationMenuFormValues[K]
  ) => {
    setValues(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  };

  const setSetting = (
    key: string,
    value: unknown
  ) => {
    setValues(
      (current) => ({
        ...current,

        settings: {
          ...current.settings,
          [key]: value,
        },
      })
    );
  };

  const generateCode = () => {
    const generated =
      values.name
        .trim()
        .toUpperCase()
        .replace(
          /[^A-Z0-9]+/g,
          "_"
        )
        .replace(
          /^_+|_+$/g,
          ""
        );

    setField(
      "code",
      generated
    );
  };

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      await onSubmit({
        ...values,

        name:
          values.name.trim(),

        code:
          values.code
            .trim()
            .toUpperCase(),

        description:
          values.description
            ?.trim() ||
          null,
      });
    };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >
      <section className="rounded-2xl border border-[#e1e3e5] bg-white p-6">
        <h2 className="text-base font-semibold">
          Menu details
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          Configure the menu
          identity and storefront
          channel.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Menu name
            </label>

            <input
              value={
                values.name
              }
              onChange={(
                event
              ) =>
                setField(
                  "name",
                  event.target
                    .value
                )
              }
              onBlur={() => {
                if (
                  !values.code
                ) {
                  generateCode();
                }
              }}
              className="admin-input"
              placeholder="Main Website Navigation"
              required
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">
                Menu code
              </label>

              <button
                type="button"
                onClick={
                  generateCode
                }
                className="text-xs font-medium text-[#005bd3] hover:underline"
              >
                Generate
              </button>
            </div>

            <input
              value={
                values.code
              }
              onChange={(
                event
              ) =>
                setField(
                  "code",
                  event.target
                    .value
                )
              }
              className="admin-input font-mono uppercase"
              placeholder="WEBSITE_MAIN"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Channel
            </label>

            <select
              value={
                values.channel
              }
              onChange={(
                event
              ) =>
                setField(
                  "channel",
                  event.target
                    .value as NavigationChannel
                )
              }
              className="admin-input"
            >
              <option value="WEBSITE">
                Website
              </option>

              <option value="KIOSK">
                Kiosk
              </option>

              <option value="BOTH">
                Website and kiosk
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Menu type
            </label>

            <select
              value={
                values.menuType
              }
              onChange={(
                event
              ) =>
                setField(
                  "menuType",
                  event.target
                    .value as NavigationMenuType
                )
              }
              className="admin-input"
            >
              <option value="SIMPLE">
                Simple links
              </option>

              <option value="DROPDOWN">
                Dropdown
              </option>

              <option value="MEGA_MENU">
                Mega menu
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={
                values.description ||
                ""
              }
              onChange={(
                event
              ) =>
                setField(
                  "description",
                  event.target
                    .value
                )
              }
              className="admin-input min-h-[100px] resize-y"
              placeholder="Describe where this navigation menu will be used."
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e1e3e5] bg-white p-6">
        <h2 className="text-base font-semibold">
          Display settings
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <ToggleSetting
            label="Desktop enabled"
            description="Display this menu on desktop devices."
            value={
              values.settings
                .desktopEnabled !==
              false
            }
            onChange={(
              value
            ) =>
              setSetting(
                "desktopEnabled",
                value
              )
            }
          />

          <ToggleSetting
            label="Mobile enabled"
            description="Display this menu in the mobile navigation."
            value={
              values.settings
                .mobileEnabled !==
              false
            }
            onChange={(
              value
            ) =>
              setSetting(
                "mobileEnabled",
                value
              )
            }
          />

          <div className="rounded-xl border border-[#e1e3e5] p-4">
            <label className="block text-sm font-medium">
              Maximum columns
            </label>

            <p className="mt-1 text-xs text-[#6d7175]">
              Number of columns
              available in the mega
              menu.
            </p>

            <select
              value={Number(
                values.settings
                  .maxColumns ||
                  4
              )}
              onChange={(
                event
              ) =>
                setSetting(
                  "maxColumns",
                  Number(
                    event.target
                      .value
                  )
                )
              }
              className="admin-input mt-3"
            >
              {[2, 3, 4, 5, 6].map(
                (count) => (
                  <option
                    key={
                      count
                    }
                    value={
                      count
                    }
                  >
                    {count} columns
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            isSubmitting
          }
          className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <LoaderCircle
              size={16}
              className="animate-spin"
            />
          ) : (
            <Save
              size={16}
            />
          )}

          {isSubmitting
            ? "Saving..."
            : submitLabel}
        </button>
      </div>
    </form>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  value: boolean;

  onChange: (
    value: boolean
  ) => void;
}

function ToggleSetting({
  label,
  description,
  value,
  onChange,
}: ToggleSettingProps) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!value)
      }
      className="flex items-center justify-between gap-4 rounded-xl border border-[#e1e3e5] p-4 text-left"
    >
      <div>
        <p className="text-sm font-medium">
          {label}
        </p>

        <p className="mt-1 text-xs text-[#6d7175]">
          {description}
        </p>
      </div>

      <span
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition",
          value
            ? "bg-[#303030]"
            : "bg-[#c9cccf]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            value
              ? "left-[22px]"
              : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}