"use client";

import {
  CalendarClock,
  Monitor,
  MonitorSmartphone,
  Smartphone,
  Tablet,
} from "lucide-react";

import type {
  CmsSectionVisibility,
} from "@/types/cms";

interface SectionVisibilityEditorProps {
  visibility: CmsSectionVisibility;
  publishStartAt: string;
  publishEndAt: string;
  onVisibilityChange: (
    visibility: CmsSectionVisibility
  ) => void;
  onPublishStartChange: (
    value: string
  ) => void;
  onPublishEndChange: (
    value: string
  ) => void;
}

const visibilityOptions = [
  {
    key: "desktop" as const,
    label: "Desktop",
    description:
      "Show on desktop and laptop screens.",
    icon: Monitor,
  },
  {
    key: "tablet" as const,
    label: "Tablet",
    description:
      "Show on medium-sized tablet screens.",
    icon: Tablet,
  },
  {
    key: "mobile" as const,
    label: "Mobile",
    description:
      "Show on mobile phone screens.",
    icon: Smartphone,
  },
  {
    key: "kiosk" as const,
    label: "Android Kiosk",
    description:
      "Show in the Jetpack Compose kiosk.",
    icon: MonitorSmartphone,
  },
];

export default function SectionVisibilityEditor({
  visibility,
  publishStartAt,
  publishEndAt,
  onVisibilityChange,
  onPublishStartChange,
  onPublishEndChange,
}: SectionVisibilityEditorProps) {
  const toggleVisibility = (
    key: keyof CmsSectionVisibility
  ) => {
    onVisibilityChange({
      ...visibility,
      [key]: !visibility[key],
    });
  };

  return (
    <div className="space-y-5">
      <section className="admin-card p-5">
        <h2 className="text-sm font-semibold">
          Device visibility
        </h2>

        <p className="mt-1 text-xs leading-5 text-[#6d7175]">
          Select the devices where this section
          should be rendered.
        </p>

        <div className="mt-4 space-y-2">
          {visibilityOptions.map(
            (option) => {
              const Icon = option.icon;
              const enabled =
                visibility[option.key];

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    toggleVisibility(
                      option.key
                    )
                  }
                  className={[
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                    enabled
                      ? "border-[#303030] bg-[#f6f6f7]"
                      : "border-[#e1e3e5] bg-white hover:bg-[#fafafa]",
                  ].join(" ")}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {option.label}
                    </p>

                    <p className="mt-0.5 text-xs text-[#6d7175]">
                      {option.description}
                    </p>
                  </div>

                  <div
                    className={[
                      "relative h-6 w-11 shrink-0 rounded-full transition",
                      enabled
                        ? "bg-[#303030]"
                        : "bg-[#c9cccf]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                        enabled
                          ? "left-[22px]"
                          : "left-0.5",
                      ].join(" ")}
                    />
                  </div>
                </button>
              );
            }
          )}
        </div>
      </section>

      <section className="admin-card p-5">
        <div className="flex items-center gap-2">
          <CalendarClock size={17} />

          <h2 className="text-sm font-semibold">
            Publishing schedule
          </h2>
        </div>

        <p className="mt-1 text-xs leading-5 text-[#6d7175]">
          Leave both values empty to keep this
          section available at all times.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="section-publish-start"
              className="mb-1.5 block text-xs font-medium"
            >
              Publish start
            </label>

            <input
              id="section-publish-start"
              type="datetime-local"
              value={publishStartAt}
              onChange={(event) =>
                onPublishStartChange(
                  event.target.value
                )
              }
              className="admin-input"
            />
          </div>

          <div>
            <label
              htmlFor="section-publish-end"
              className="mb-1.5 block text-xs font-medium"
            >
              Publish end
            </label>

            <input
              id="section-publish-end"
              type="datetime-local"
              value={publishEndAt}
              onChange={(event) =>
                onPublishEndChange(
                  event.target.value
                )
              }
              className="admin-input"
            />
          </div>
        </div>
      </section>
    </div>
  );
}