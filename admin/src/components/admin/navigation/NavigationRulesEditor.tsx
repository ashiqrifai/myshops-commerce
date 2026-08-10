"use client";

import {
  CalendarDays,
  Monitor,
  Smartphone,
  Tablet,
  UserRound,
} from "lucide-react";

import type {
  NavigationAudience,
  NavigationItemSettings,
  NavigationRuleChannel,
  NavigationRuleDevice,
  NavigationVisibilityRules,
} from "@/types/navigation";

interface NavigationRulesEditorProps {
  settings:
    NavigationItemSettings;

  onChange: (
    settings:
      NavigationItemSettings
  ) => void;
}

const defaultRules:
  NavigationVisibilityRules = {
  audience:
    "ALL",

  channels: [
    "WEBSITE",
    "KIOSK",
  ],

  devices: [
    "DESKTOP",
    "TABLET",
    "MOBILE",
  ],

  requirePromotion:
    false,

  promotionStartAt:
    null,

  promotionEndAt:
    null,
};

export default function NavigationRulesEditor({
  settings,
  onChange,
}: NavigationRulesEditorProps) {
  const rules: NavigationVisibilityRules = {
    ...defaultRules,
    ...(settings.visibilityRules ||
      {}),
  };

  const updateRules = (
    changes:
      Partial<NavigationVisibilityRules>
  ) => {
    onChange({
      ...settings,

      visibilityRules: {
        ...rules,
        ...changes,
      },
    });
  };

  const toggleChannel = (
    channel:
      NavigationRuleChannel
  ) => {
    const selected =
      rules.channels.includes(
        channel
      );

    const channels =
      selected
        ? rules.channels.filter(
            (value) =>
              value !==
              channel
          )
        : [
            ...rules.channels,
            channel,
          ];

    updateRules({
      channels,
    });
  };

  const toggleDevice = (
    device:
      NavigationRuleDevice
  ) => {
    const selected =
      rules.devices.includes(
        device
      );

    const devices =
      selected
        ? rules.devices.filter(
            (value) =>
              value !==
              device
          )
        : [
            ...rules.devices,
            device,
          ];

    updateRules({
      devices,
    });
  };

  return (
    <section className="border-t border-[#e1e3e5] pt-6">
      <div>
        <h3 className="text-sm font-semibold">
          Display rules
        </h3>

        <p className="mt-1 text-xs leading-5 text-[#6d7175]">
          Control who can see this navigation item and where it should appear.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Audience
          </label>

          <div className="relative">
            <UserRound
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
            />

            <select
              value={
                rules.audience
              }
              onChange={(
                event
              ) =>
                updateRules({
                  audience:
                    event.target
                      .value as NavigationAudience,
                })
              }
              className="admin-input pl-10"
            >
              <option value="ALL">
                All visitors
              </option>

              <option value="GUEST_ONLY">
                Guest users only
              </option>

              <option value="AUTHENTICATED_ONLY">
                Logged-in users only
              </option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">
            Channels
          </p>

          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <SelectionCard
              label="Website"
              description="Show in the ecommerce website."
              selected={rules.channels.includes(
                "WEBSITE"
              )}
              onClick={() =>
                toggleChannel(
                  "WEBSITE"
                )
              }
            />

            <SelectionCard
              label="Kiosk"
              description="Show in the in-store kiosk."
              selected={rules.channels.includes(
                "KIOSK"
              )}
              onClick={() =>
                toggleChannel(
                  "KIOSK"
                )
              }
            />
          </div>

          {rules.channels.length ===
            0 && (
            <p className="mt-2 text-xs text-red-600">
              Select at least one channel.
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium">
            Devices
          </p>

          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <DeviceCard
              label="Desktop"
              icon={
                Monitor
              }
              selected={rules.devices.includes(
                "DESKTOP"
              )}
              onClick={() =>
                toggleDevice(
                  "DESKTOP"
                )
              }
            />

            <DeviceCard
              label="Tablet"
              icon={
                Tablet
              }
              selected={rules.devices.includes(
                "TABLET"
              )}
              onClick={() =>
                toggleDevice(
                  "TABLET"
                )
              }
            />

            <DeviceCard
              label="Mobile"
              icon={
                Smartphone
              }
              selected={rules.devices.includes(
                "MOBILE"
              )}
              onClick={() =>
                toggleDevice(
                  "MOBILE"
                )
              }
            />
          </div>

          {rules.devices.length ===
            0 && (
            <p className="mt-2 text-xs text-red-600">
              Select at least one device.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[#e1e3e5] p-4">
          <BooleanRow
            label="Promotion schedule"
            description="Show this item only during a configured promotion period."
            value={
              rules.requirePromotion
            }
            onChange={(
              value
            ) =>
              updateRules({
                requirePromotion:
                  value,
              })
            }
          />

          {rules.requirePromotion && (
            <div className="mt-4 grid gap-4 border-t border-[#e1e3e5] pt-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Start date and time
                </label>

                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                  />

                  <input
                    type="datetime-local"
                    value={
                      toDateTimeLocalValue(
                        rules.promotionStartAt
                      )
                    }
                    onChange={(
                      event
                    ) =>
                      updateRules({
                        promotionStartAt:
                          event.target
                            .value ||
                          null,
                      })
                    }
                    className="admin-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  End date and time
                </label>

                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                  />

                  <input
                    type="datetime-local"
                    value={
                      toDateTimeLocalValue(
                        rules.promotionEndAt
                      )
                    }
                    onChange={(
                      event
                    ) =>
                      updateRules({
                        promotionEndAt:
                          event.target
                            .value ||
                          null,
                      })
                    }
                    className="admin-input pl-10"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface SelectionCardProps {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function SelectionCard({
  label,
  description,
  selected,
  onClick,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "rounded-xl border p-4 text-left transition",
        selected
          ? "border-[#303030] bg-[#f6f6f7]"
          : "border-[#e1e3e5] bg-white hover:bg-[#fafafa]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">
          {label}
        </span>

        <span
          className={[
            "h-4 w-4 rounded border",
            selected
              ? "border-[#303030] bg-[#303030]"
              : "border-[#babfc3] bg-white",
          ].join(" ")}
        />
      </div>

      <p className="mt-1 text-xs leading-5 text-[#6d7175]">
        {description}
      </p>
    </button>
  );
}

interface DeviceCardProps {
  label: string;
  icon:
    React.ElementType;
  selected: boolean;
  onClick: () => void;
}

function DeviceCard({
  label,
  icon: Icon,
  selected,
  onClick,
}: DeviceCardProps) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "flex flex-col items-center justify-center rounded-xl border px-3 py-4 transition",
        selected
          ? "border-[#303030] bg-[#f6f6f7]"
          : "border-[#e1e3e5] bg-white hover:bg-[#fafafa]",
      ].join(" ")}
    >
      <Icon
        size={20}
      />

      <span className="mt-2 text-sm font-medium">
        {label}
      </span>
    </button>
  );
}

interface BooleanRowProps {
  label: string;
  description: string;
  value: boolean;

  onChange: (
    value: boolean
  ) => void;
}

function BooleanRow({
  label,
  description,
  value,
  onChange,
}: BooleanRowProps) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !value
        )
      }
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <div>
        <p className="text-sm font-medium">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#6d7175]">
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

function toDateTimeLocalValue(
  value:
    string | null
): string {
  if (!value) {
    return "";
  }

  return value.length >= 16
    ? value.slice(
        0,
        16
      )
    : value;
}