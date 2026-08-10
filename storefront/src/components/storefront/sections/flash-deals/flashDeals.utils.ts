export interface FlashDealsSettings {
  sourceType?: string;

  layout?:
    | "BANNER_TOP"
    | "SIDE_BANNER"
    | "BACKGROUND_BANNER";

  itemsDesktop?: number;
  itemsTablet?: number;
  itemsMobile?: number;
  itemsKiosk?: number;

  maximumProducts?: number;
  showCountdown?: boolean;
  showNavigation?: boolean;

  backgroundColor?: string;
  textColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;

  cardStyle?:
    | "ROUNDED"
    | "SQUARE";

  contentAlignment?:
    | "LEFT"
    | "CENTER"
    | "RIGHT";

  hideWhenExpired?: boolean;
}

export interface FlashDealsContent {
  badge?: string;
  title?: string;
  subtitle?: string;

  buttonLabel?: string;
  buttonUrl?: string;
  openInNewTab?: boolean;

  desktopAssetId?: string | null;
  mobileAssetId?: string | null;

  desktopAssetIdResolved?: StorefrontMediaAsset | null;
  mobileAssetIdResolved?: StorefrontMediaAsset | null;

  productIdsResolved?: Array<
    Record<string, unknown> & {
      id: string;
    }
  >;

  startAt?: string | null;
  endAt?: string | null;

  dealStatus?:
    | "ACTIVE"
    | "UPCOMING"
    | "ENDED";
}

export interface StorefrontMediaAsset {
  publicUrl?: string | null;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;

  variants?: Array<{
    variantType?: string;
    publicUrl?: string | null;
  }>;
}

export function getMediaUrl(
  asset?:
    | StorefrontMediaAsset
    | null
): string | null {
  if (!asset) {
    return null;
  }

  const preferredTypes = [
    "LARGE",
    "MEDIUM",
    "PREVIEW",
    "ORIGINAL",
    "THUMBNAIL",
  ];

  for (
    const variantType of
    preferredTypes
  ) {
    const variant =
      asset.variants?.find(
        (item) =>
          item.variantType ===
            variantType &&
          Boolean(
            item.publicUrl
          )
      );

    if (
      variant?.publicUrl
    ) {
      return variant.publicUrl;
    }
  }

  return (
    asset.previewUrl ||
    asset.publicUrl ||
    asset.thumbnailUrl ||
    null
  );
}

export function getCardWidthClasses(
  settings:
    FlashDealsSettings
): string {
  const mobile =
    Math.max(
      1,
      Number(
        settings.itemsMobile ||
          2
      )
    );

  const tablet =
    Math.max(
      1,
      Number(
        settings.itemsTablet ||
          3
      )
    );

  const desktop =
    Math.max(
      1,
      Number(
        settings.itemsDesktop ||
          5
      )
    );

  const mobileClass =
    mobile >= 2
      ? "basis-[calc(50%-0.375rem)]"
      : "basis-[86%]";

  const tabletClass =
    tablet >= 4
      ? "sm:basis-[calc(25%-0.75rem)]"
      : tablet === 3
        ? "sm:basis-[calc(33.333%-0.75rem)]"
        : "sm:basis-[calc(50%-0.5rem)]";

  const desktopClass =
    desktop >= 6
      ? "lg:basis-[calc(16.666%-1rem)]"
      : desktop === 5
        ? "lg:basis-[calc(20%-1rem)]"
        : desktop === 4
          ? "lg:basis-[calc(25%-0.9375rem)]"
          : desktop === 3
            ? "lg:basis-[calc(33.333%-0.875rem)]"
            : "lg:basis-[calc(50%-0.625rem)]";

  return [
    mobileClass,
    tabletClass,
    desktopClass,
  ].join(" ");
}

export function getTextAlignmentClass(
  alignment?:
    FlashDealsSettings["contentAlignment"]
) {
  if (
    alignment === "CENTER"
  ) {
    return "items-center text-center";
  }

  if (
    alignment === "RIGHT"
  ) {
    return "items-end text-right";
  }

  return "items-start text-left";
}
