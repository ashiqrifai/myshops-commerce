import type {
    MediaAsset,
  } from "@/types/media";
  
  const API_ORIGIN = (
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5080/api/v1"
  ).replace(
    /\/api\/v1\/?$/,
    ""
  );
  
  export function resolveNavigationMediaUrl(
    value?:
      string | null
  ): string | null {
    if (!value) {
      return null;
    }
  
    if (
      value.startsWith(
        "http://"
      ) ||
      value.startsWith(
        "https://"
      )
    ) {
      return value;
    }
  
    return `${API_ORIGIN}${value}`;
  }
  
  export function getNavigationAssetImageUrl(
    asset?:
      MediaAsset | null
  ): string | null {
    if (!asset) {
      return null;
    }
  
    const preview =
      asset.variants?.find(
        (
          variant
        ) =>
          variant.variantType ===
            "PREVIEW" &&
          variant.format ===
            "webp" &&
          variant.isActive
      );
  
    const thumbnail =
      asset.variants?.find(
        (
          variant
        ) =>
          variant.variantType ===
            "THUMBNAIL" &&
          variant.format ===
            "webp" &&
          variant.isActive
      );
  
    const activeVariant =
      asset.variants?.find(
        (
          variant
        ) =>
          variant.isActive
      );
  
    return resolveNavigationMediaUrl(
      preview?.publicUrl ||
        thumbnail?.publicUrl ||
        activeVariant?.publicUrl ||
        asset.publicUrl
    );
  }