"use client";

import {
  ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useState,
} from "react";

import MediaAssetPicker from "@/components/media/MediaAssetPicker";

interface Props {
  value:
    Record<
      string,
      unknown
    >;

  settings:
    Record<
      string,
      unknown
    >;

  onChange: (
    value:
      Record<
        string,
        unknown
      >
  ) => void;

  onSettingsChange: (
    value:
      Record<
        string,
        unknown
      >
  ) => void;
}

interface DesktopSlide {
  id:
    string;

  desktopAssetId:
    string | null;

  linkUrl:
    string;

  altText:
    string;

  isActive:
    boolean;
}

interface SidePromo {
  id:
    string;

  desktopAssetId:
    string | null;

  linkUrl:
    string;

  altText:
    string;

  isActive:
    boolean;
}

interface MobileSlide {
  id:
    string;

  assetId:
    string | null;

  linkUrl:
    string;

  altText:
    string;

  isActive:
    boolean;
}

interface BrandItem {
  id:
    string;

  assetId:
    string | null;

  linkUrl:
    string;

  altText:
    string;

  isActive:
    boolean;
}

const uid =
  () =>
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

function MediaPickerField({
  label,
  value,
  onChange,
}: {
  label:
    string;

  value:
    string | null;

  onChange: (
    value:
      string | null
  ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  return (
    <>
      <div>
        <p className="mb-2 text-sm font-medium text-[#202223]">
          {
            label
          }
        </p>

        <button
          type="button"
          onClick={() =>
            setOpen(
              true
            )
          }
          className="flex min-h-[92px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#BABFC3] bg-[#FAFAFA] px-4 text-sm font-semibold text-[#5C5F62]"
        >
          <ImageIcon
            size={
              17
            }
          />

          {value
            ? "Image selected"
            : `Choose ${label.toLowerCase()}`}
        </button>

        {value ? (
          <button
            type="button"
            onClick={() =>
              onChange(
                null
              )
            }
            className="mt-2 text-xs font-semibold text-red-600"
          >
            Remove image
          </button>
        ) : null}
      </div>

      {open ? (
        <MediaAssetPicker
          isOpen
          selectedAssetId={
            value
          }
          title={`Select ${label}`}
          description="Select an image from the Digital Asset Library."
          classification="CMS"
          allowPdf={
            false
          }
          onClose={() =>
            setOpen(
              false
            )
          }
          onSelect={(
            asset
          ) => {
            onChange(
              asset.id
            );

            setOpen(
              false
            );
          }}
        />
      ) : null}
    </>
  );
}

const normalizeDesktopSlide =
  (
    value:
      unknown
  ): DesktopSlide => {
    const record =
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
        ? value as Record<
            string,
            unknown
          >
        : {};

    return {
      id:
        typeof record.id ===
          "string"
          ? record.id
          : uid(),

      desktopAssetId:
        typeof record.desktopAssetId ===
          "string"
          ? record.desktopAssetId
          : null,

      linkUrl:
        typeof record.linkUrl ===
          "string"
          ? record.linkUrl
          : "",

      altText:
        typeof record.altText ===
          "string"
          ? record.altText
          : "",

      isActive:
        record.isActive !==
        false,
    };
  };

const normalizeMobileSlide =
  (
    value:
      unknown
  ): MobileSlide => {
    const record =
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
        ? value as Record<
            string,
            unknown
          >
        : {};

    return {
      id:
        typeof record.id ===
          "string"
          ? record.id
          : uid(),

      assetId:
        typeof record.assetId ===
          "string"
          ? record.assetId
          : null,

      linkUrl:
        typeof record.linkUrl ===
          "string"
          ? record.linkUrl
          : "",

      altText:
        typeof record.altText ===
          "string"
          ? record.altText
          : "",

      isActive:
        record.isActive !==
        false,
    };
  };

const normalizeBrand =
  (
    value:
      unknown
  ): BrandItem => {
    const record =
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
        ? value as Record<
            string,
            unknown
          >
        : {};

    return {
      id:
        typeof record.id ===
          "string"
          ? record.id
          : uid(),

      assetId:
        typeof record.assetId ===
          "string"
          ? record.assetId
          : null,

      linkUrl:
        typeof record.linkUrl ===
          "string"
          ? record.linkUrl
          : "",

      altText:
        typeof record.altText ===
          "string"
          ? record.altText
          : "",

      isActive:
        record.isActive !==
        false,
    };
  };

export default function HeroPromoGridEditor({
  value,
  settings,
  onChange,
  onSettingsChange,
}: Props) {
  const desktopSlides =
    (
      Array.isArray(
        value.slides
      )
        ? value.slides
        : []
    ).map(
      normalizeDesktopSlide
    );

  const sidePromos =
    (
      Array.isArray(
        value.promoCards
      )
        ? value.promoCards
        : []
    ).map(
      normalizeDesktopSlide
    ) as SidePromo[];

  const mobileSlides =
    (
      Array.isArray(
        value.mobileSlides
      )
        ? value.mobileSlides
        : []
    ).map(
      normalizeMobileSlide
    );

  const brandItems =
    (
      Array.isArray(
        value.brandItems
      )
        ? value.brandItems
        : []
    ).map(
      normalizeBrand
    );

  const setSetting =
    (
      key:
        string,
      nextValue:
        unknown
    ) => {
      onSettingsChange({
        ...settings,
        [key]:
          nextValue,
      });
    };

  return (
    <div className="space-y-6">
      {/* General Settings */}

      <section className="admin-card p-6">
        <h2 className="text-lg font-semibold text-[#202223]">
          Hero Promo Grid
        </h2>

        <p className="mt-1 text-sm text-[#6D7175]">
          Desktop and mobile use completely separate layouts and artwork.
        </p>
      </section>

      {/* Desktop Settings */}

      <section className="admin-card p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6D7175]">
            Desktop
          </p>

          <h2 className="mt-1 text-lg font-semibold text-[#202223]">
            Desktop layout settings
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium">
            Desktop height
            <input
              type="number"
              min={
                280
              }
              className="admin-input mt-1"
              value={
                Number(
                  settings.heroHeightDesktop ||
                  450
                )
              }
              onChange={(
                event
              ) =>
                setSetting(
                  "heroHeightDesktop",
                  Number(
                    event.target.value
                  )
                )
              }
            />
          </label>

          <label className="text-sm font-medium">
            Desktop autoplay delay (ms)
            <input
              type="number"
              min={
                2000
              }
              className="admin-input mt-1"
              value={
                Number(
                  settings.autoplayDelayMs ||
                  5000
                )
              }
              onChange={(
                event
              ) =>
                setSetting(
                  "autoplayDelayMs",
                  Number(
                    event.target.value
                  )
                )
              }
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                settings.autoplay !==
                false
              }
              onChange={(
                event
              ) =>
                setSetting(
                  "autoplay",
                  event.target.checked
                )
              }
            />
            Autoplay
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                settings.showArrows !==
                false
              }
              onChange={(
                event
              ) =>
                setSetting(
                  "showArrows",
                  event.target.checked
                )
              }
            />
            Show arrows
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                settings.showDots !==
                false
              }
              onChange={(
                event
              ) =>
                setSetting(
                  "showDots",
                  event.target.checked
                )
              }
            />
            Show dots
          </label>
        </div>
      </section>

      {/* Desktop Main Slides */}

      <section className="admin-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6D7175]">
              Desktop
            </p>

            <h2 className="mt-1 text-lg font-semibold text-[#202223]">
              Main hero carousel
            </h2>

            <p className="mt-1 text-sm text-[#6D7175]">
              These slides are used only on desktop.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,

                slides: [
                  ...desktopSlides,

                  {
                    id:
                      uid(),

                    desktopAssetId:
                      null,

                    linkUrl:
                      "",

                    altText:
                      "",

                    isActive:
                      true,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#303030] px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus
              size={
                15
              }
            />
            Add desktop slide
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {desktopSlides.map(
            (
              slide,
              index
            ) => {
              const patch =
                (
                  partial:
                    Partial<
                      DesktopSlide
                    >
                ) => {
                  onChange({
                    ...value,

                    slides:
                      desktopSlides.map(
                        (
                          item,
                          itemIndex
                        ) =>
                          itemIndex ===
                          index
                            ? {
                                ...item,
                                ...partial,
                              }
                            : item
                      ),
                  });
                };

              return (
                <div
                  key={
                    slide.id
                  }
                  className="rounded-xl border border-[#E1E3E5] p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-semibold">
                      Desktop slide{" "}
                      {
                        index +
                        1
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...value,

                          slides:
                            desktopSlides.filter(
                              (
                                _,
                                itemIndex
                              ) =>
                                itemIndex !==
                                index
                            ),
                        })
                      }
                      className="text-red-600"
                    >
                      <Trash2
                        size={
                          16
                        }
                      />
                    </button>
                  </div>

                  <MediaPickerField
                    label="Desktop image"
                    value={
                      slide.desktopAssetId
                    }
                    onChange={(
                      assetId
                    ) =>
                      patch({
                        desktopAssetId:
                          assetId,
                      })
                    }
                  />

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      className="admin-input"
                      placeholder="/collections/flash-deals"
                      value={
                        slide.linkUrl
                      }
                      onChange={(
                        event
                      ) =>
                        patch({
                          linkUrl:
                            event.target.value,
                        })
                      }
                    />

                    <input
                      className="admin-input"
                      placeholder="Image alt text"
                      value={
                        slide.altText
                      }
                      onChange={(
                        event
                      ) =>
                        patch({
                          altText:
                            event.target.value,
                        })
                      }
                    />
                  </div>

                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        slide.isActive
                      }
                      onChange={(
                        event
                      ) =>
                        patch({
                          isActive:
                            event.target.checked,
                        })
                      }
                    />

                    Active
                  </label>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* Desktop Side Promos */}

      <section className="admin-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6D7175]">
              Desktop
            </p>

            <h2 className="mt-1 text-lg font-semibold text-[#202223]">
              Side promotions
            </h2>

            <p className="mt-1 text-sm text-[#6D7175]">
              The first two active cards appear beside the main desktop hero.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,

                promoCards: [
                  ...sidePromos,

                  {
                    id:
                      uid(),

                    desktopAssetId:
                      null,

                    linkUrl:
                      "",

                    altText:
                      "",

                    isActive:
                      true,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#303030] px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus
              size={
                15
              }
            />

            Add side promo
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {sidePromos.map(
            (
              promo,
              index
            ) => {
              const patch =
                (
                  partial:
                    Partial<
                      SidePromo
                    >
                ) => {
                  onChange({
                    ...value,

                    promoCards:
                      sidePromos.map(
                        (
                          item,
                          itemIndex
                        ) =>
                          itemIndex ===
                          index
                            ? {
                                ...item,
                                ...partial,
                              }
                            : item
                      ),
                  });
                };

              return (
                <div
                  key={
                    promo.id
                  }
                  className="rounded-xl border border-[#E1E3E5] p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-semibold">
                      Side promo{" "}
                      {
                        index +
                        1
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...value,

                          promoCards:
                            sidePromos.filter(
                              (
                                _,
                                itemIndex
                              ) =>
                                itemIndex !==
                                index
                            ),
                        })
                      }
                      className="text-red-600"
                    >
                      <Trash2
                        size={
                          16
                        }
                      />
                    </button>
                  </div>

                  <MediaPickerField
                    label="Desktop image"
                    value={
                      promo.desktopAssetId
                    }
                    onChange={(
                      assetId
                    ) =>
                      patch({
                        desktopAssetId:
                          assetId,
                      })
                    }
                  />

                  <input
                    className="admin-input mt-4"
                    placeholder="Link URL"
                    value={
                      promo.linkUrl
                    }
                    onChange={(
                      event
                    ) =>
                      patch({
                        linkUrl:
                          event.target.value,
                      })
                    }
                  />

                  <input
                    className="admin-input mt-3"
                    placeholder="Image alt text"
                    value={
                      promo.altText
                    }
                    onChange={(
                      event
                    ) =>
                      patch({
                        altText:
                          event.target.value,
                      })
                    }
                  />

                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        promo.isActive
                      }
                      onChange={(
                        event
                      ) =>
                        patch({
                          isActive:
                            event.target.checked,
                        })
                      }
                    />

                    Active
                  </label>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* Mobile Settings */}

      <section className="admin-card p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6D7175]">
            Mobile
          </p>

          <h2 className="mt-1 text-lg font-semibold text-[#202223]">
            Mobile carousel settings
          </h2>

          <p className="mt-1 text-sm text-[#6D7175]">
            Mobile uses its own full-width carousel and does not use the desktop artwork.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Mobile slide height
            <input
              type="number"
              min={
                160
              }
              className="admin-input mt-1"
              value={
                Number(
                  settings.mobileHeight ||
                  220
                )
              }
              onChange={(
                event
              ) =>
                setSetting(
                  "mobileHeight",
                  Number(
                    event.target.value
                  )
                )
              }
            />
          </label>

          <label className="text-sm font-medium">
            Mobile autoplay delay (ms)
            <input
              type="number"
              min={
                2000
              }
              className="admin-input mt-1"
              value={
                Number(
                  settings.mobileAutoplayDelayMs ||
                  4000
                )
              }
              onChange={(
                event
              ) =>
                setSetting(
                  "mobileAutoplayDelayMs",
                  Number(
                    event.target.value
                  )
                )
              }
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                settings.mobileAutoplay !==
                false
              }
              onChange={(
                event
              ) =>
                setSetting(
                  "mobileAutoplay",
                  event.target.checked
                )
              }
            />

            Mobile autoplay
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                settings.mobileShowDots !==
                false
              }
              onChange={(
                event
              ) =>
                setSetting(
                  "mobileShowDots",
                  event.target.checked
                )
              }
            />

            Mobile dots
          </label>
        </div>
      </section>

      {/* Mobile Slides */}

      <section className="admin-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6D7175]">
              Mobile
            </p>

            <h2 className="mt-1 text-lg font-semibold text-[#202223]">
              Mobile carousel slides
            </h2>

            <p className="mt-1 text-sm text-[#6D7175]">
              Each slide has the same mobile size and rotates automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,

                mobileSlides: [
                  ...mobileSlides,

                  {
                    id:
                      uid(),

                    assetId:
                      null,

                    linkUrl:
                      "",

                    altText:
                      "",

                    isActive:
                      true,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#303030] px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus
              size={
                15
              }
            />

            Add mobile slide
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {mobileSlides.map(
            (
              slide,
              index
            ) => {
              const patch =
                (
                  partial:
                    Partial<
                      MobileSlide
                    >
                ) => {
                  onChange({
                    ...value,

                    mobileSlides:
                      mobileSlides.map(
                        (
                          item,
                          itemIndex
                        ) =>
                          itemIndex ===
                          index
                            ? {
                                ...item,
                                ...partial,
                              }
                            : item
                      ),
                  });
                };

              return (
                <div
                  key={
                    slide.id
                  }
                  className="rounded-xl border border-[#E1E3E5] p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-semibold">
                      Mobile slide{" "}
                      {
                        index +
                        1
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...value,

                          mobileSlides:
                            mobileSlides.filter(
                              (
                                _,
                                itemIndex
                              ) =>
                                itemIndex !==
                                index
                            ),
                        })
                      }
                      className="text-red-600"
                    >
                      <Trash2
                        size={
                          16
                        }
                      />
                    </button>
                  </div>

                  <MediaPickerField
                    label="Mobile slide image"
                    value={
                      slide.assetId
                    }
                    onChange={(
                      assetId
                    ) =>
                      patch({
                        assetId,
                      })
                    }
                  />

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      className="admin-input"
                      placeholder="Link URL"
                      value={
                        slide.linkUrl
                      }
                      onChange={(
                        event
                      ) =>
                        patch({
                          linkUrl:
                            event.target.value,
                        })
                      }
                    />

                    <input
                      className="admin-input"
                      placeholder="Image alt text"
                      value={
                        slide.altText
                      }
                      onChange={(
                        event
                      ) =>
                        patch({
                          altText:
                            event.target.value,
                        })
                      }
                    />
                  </div>

                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        slide.isActive
                      }
                      onChange={(
                        event
                      ) =>
                        patch({
                          isActive:
                            event.target.checked,
                        })
                      }
                    />

                    Active
                  </label>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* Brand Strip */}

      <section className="admin-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#202223]">
              Brand strip
            </h2>

            <p className="mt-1 text-sm text-[#6D7175]">
              Optional brand logo strip shown below the hero.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,

                brandItems: [
                  ...brandItems,

                  {
                    id:
                      uid(),

                    assetId:
                      null,

                    linkUrl:
                      "",

                    altText:
                      "",

                    isActive:
                      true,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#303030] px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus
              size={
                15
              }
            />

            Add brand
          </button>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={
              settings.showBrandStrip !==
              false
            }
            onChange={(
              event
            ) =>
              setSetting(
                "showBrandStrip",
                event.target.checked
              )
            }
          />

          Show brand strip
        </label>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {brandItems.map(
            (
              brand,
              index
            ) => {
              const patch =
                (
                  partial:
                    Partial<
                      BrandItem
                    >
                ) => {
                  onChange({
                    ...value,

                    brandItems:
                      brandItems.map(
                        (
                          item,
                          itemIndex
                        ) =>
                          itemIndex ===
                          index
                            ? {
                                ...item,
                                ...partial,
                              }
                            : item
                      ),
                  });
                };

              return (
                <div
                  key={
                    brand.id
                  }
                  className="rounded-xl border border-[#E1E3E5] p-4"
                >
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...value,

                          brandItems:
                            brandItems.filter(
                              (
                                _,
                                itemIndex
                              ) =>
                                itemIndex !==
                                index
                            ),
                        })
                      }
                      className="text-red-600"
                    >
                      <Trash2
                        size={
                          16
                        }
                      />
                    </button>
                  </div>

                  <MediaPickerField
                    label="Brand logo"
                    value={
                      brand.assetId
                    }
                    onChange={(
                      assetId
                    ) =>
                      patch({
                        assetId,
                      })
                    }
                  />

                  <input
                    className="admin-input mt-3"
                    placeholder="/brands/apple"
                    value={
                      brand.linkUrl
                    }
                    onChange={(
                      event
                    ) =>
                      patch({
                        linkUrl:
                          event.target.value,
                      })
                    }
                  />

                  <input
                    className="admin-input mt-3"
                    placeholder="Brand alt text"
                    value={
                      brand.altText
                    }
                    onChange={(
                      event
                    ) =>
                      patch({
                        altText:
                          event.target.value,
                      })
                    }
                  />

                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        brand.isActive
                      }
                      onChange={(
                        event
                      ) =>
                        patch({
                          isActive:
                            event.target.checked,
                        })
                      }
                    />

                    Active
                  </label>
                </div>
              );
            }
          )}
        </div>
      </section>
    </div>
  );
}
