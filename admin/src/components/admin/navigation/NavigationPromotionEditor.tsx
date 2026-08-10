"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ImageIcon,
  Sparkles,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

import {
  getPromotionSettings,
} from "./navigationPromotion";

import type {
  NavigationItemSettings,
  NavigationPromotionOverlay,
  NavigationPromotionSettings,
} from "@/types/navigation";

interface NavigationPromotionEditorProps {
  settings:
    NavigationItemSettings;

  onChange: (
    settings:
      NavigationItemSettings
  ) => void;
}

export default function NavigationPromotionEditor({
  settings,
  onChange,
}: NavigationPromotionEditorProps) {
  const promotion =
    getPromotionSettings(
      settings
    );

  const setPromotionField = <
    K extends keyof NavigationPromotionSettings,
  >(
    field: K,
    value:
      NavigationPromotionSettings[K]
  ) => {
    onChange({
      ...settings,

      promotion: {
        ...promotion,

        [field]:
          value,
      },
    });
  };

  return (
    <section className="border-t border-[#e1e3e5] pt-6">
      <div className="flex items-center gap-2">
        <Sparkles
          size={17}
          className="text-[#8a4b08]"
        />

        <h3 className="text-sm font-semibold">
          Promotion content
        </h3>
      </div>

      <p className="mt-1 text-xs leading-5 text-[#6d7175]">
        Configure the promotion text, CTA, alignment and visual treatment.
      </p>

      <div className="mt-4 space-y-4">
        <TextField
          label="Eyebrow"
          value={
            promotion.eyebrow
          }
          placeholder="Limited offer"
          onChange={(
            value
          ) =>
            setPromotionField(
              "eyebrow",
              value
            )
          }
        />

        <TextField
          label="Promotion title"
          value={
            promotion.title
          }
          placeholder="MacBook Air"
          onChange={(
            value
          ) =>
            setPromotionField(
              "title",
              value
            )
          }
        />

        <TextField
          label="Subtitle"
          value={
            promotion.subtitle
          }
          placeholder="Save up to 25%"
          onChange={(
            value
          ) =>
            setPromotionField(
              "subtitle",
              value
            )
          }
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Description
          </label>

          <textarea
            value={
              promotion.description ||
              ""
            }
            onChange={(
              event
            ) =>
              setPromotionField(
                "description",
                event.target.value ||
                  null
              )
            }
            className="admin-input min-h-[84px] resize-y"
            placeholder="Discover the latest models and exclusive offers."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="CTA text"
            value={
              promotion.ctaText
            }
            placeholder="Shop now"
            onChange={(
              value
            ) =>
              setPromotionField(
                "ctaText",
                value
              )
            }
          />

          <TextField
            label="CTA destination"
            value={
              promotion.ctaUrl
            }
            placeholder="/collections/macbook"
            onChange={(
              value
            ) =>
              setPromotionField(
                "ctaUrl",
                value
              )
            }
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Text alignment
          </label>

          <div className="grid grid-cols-3 gap-2">
            <OptionButton
              active={
                promotion.textAlign ===
                "LEFT"
              }
              icon={
                <AlignLeft
                  size={16}
                />
              }
              label="Left"
              onClick={() =>
                setPromotionField(
                  "textAlign",
                  "LEFT"
                )
              }
            />

            <OptionButton
              active={
                promotion.textAlign ===
                "CENTER"
              }
              icon={
                <AlignCenter
                  size={16}
                />
              }
              label="Centre"
              onClick={() =>
                setPromotionField(
                  "textAlign",
                  "CENTER"
                )
              }
            />

            <OptionButton
              active={
                promotion.textAlign ===
                "RIGHT"
              }
              icon={
                <AlignRight
                  size={16}
                />
              }
              label="Right"
              onClick={() =>
                setPromotionField(
                  "textAlign",
                  "RIGHT"
                )
              }
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Image overlay
          </label>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                "NONE",
                "LIGHT",
                "DARK",
              ] as NavigationPromotionOverlay[]
            ).map(
              (
                overlay
              ) => (
                <button
                  key={
                    overlay
                  }
                  type="button"
                  onClick={() =>
                    setPromotionField(
                      "overlay",
                      overlay
                    )
                  }
                  className={[
                    "h-10 rounded-lg border px-3 text-sm font-medium transition",
                    promotion.overlay ===
                    overlay
                      ? "border-[#303030] bg-[#303030] text-white"
                      : "border-[#babfc3] bg-white hover:bg-[#fafafa]",
                  ].join(
                    " "
                  )}
                >
                  {formatLabel(
                    overlay
                  )}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ColourField
            label="Text colour"
            value={
              promotion.textColor
            }
            fallback="#FFFFFF"
            onChange={(
              value
            ) =>
              setPromotionField(
                "textColor",
                value
              )
            }
          />

          <ColourField
            label="Background colour"
            value={
              promotion.backgroundColor
            }
            fallback="#303030"
            onChange={(
              value
            ) =>
              setPromotionField(
                "backgroundColor",
                value
              )
            }
          />
        </div>

        <div className="rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4">
          <div className="flex gap-3">
            <ImageIcon
              size={18}
              className="mt-0.5 shrink-0 text-[#6d7175]"
            />

            <div>
              <p className="text-sm font-medium">
                Promotion image
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                Select the image from the DAM section below. These settings
                control the text displayed over that image.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label:
    string;

  value:
    string | null;

  placeholder:
    string;

  onChange: (
    value:
      string | null
  ) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <input
        value={
          value ||
          ""
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value ||
              null
          )
        }
        className="admin-input"
        placeholder={
          placeholder
        }
      />
    </div>
  );
}

function OptionButton({
  active,
  icon,
  label,
  onClick,
}: {
  active:
    boolean;

  icon:
    ReactNode;

  label:
    string;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition",
        active
          ? "border-[#303030] bg-[#303030] text-white"
          : "border-[#babfc3] bg-white hover:bg-[#fafafa]",
      ].join(
        " "
      )}
    >
      {icon}

      {label}
    </button>
  );
}

function ColourField({
  label,
  value,
  fallback,
  onChange,
}: {
  label:
    string;

  value:
    string | null;

  fallback:
    string;

  onChange: (
    value:
      string | null
  ) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          type="color"
          value={
            normalizeHex(
              value,
              fallback
            )
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          className="h-10 w-12 rounded-lg border border-[#babfc3] bg-white p-1"
        />

        <input
          value={
            value ||
            ""
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value ||
                null
            )
          }
          className="admin-input flex-1"
          placeholder={
            fallback
          }
        />
      </div>
    </div>
  );
}

function normalizeHex(
  value:
    string | null,
  fallback:
    string
): string {
  if (
    value &&
    /^#[0-9a-fA-F]{6}$/.test(
      value
    )
  ) {
    return value;
  }

  return fallback;
}

function formatLabel(
  value:
    string
): string {
  return value
    .toLowerCase()
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character.toUpperCase()
    );
}