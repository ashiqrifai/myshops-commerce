import type {
    StorefrontSection,
  } from "@/types/storefront";
  
  export const isExternalUrl = (
    value?: string | null
  ): boolean => {
    if (!value) {
      return false;
    }
  
    return (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:")
    );
  };
  
  export const asRecord = (
    value: unknown
  ): Record<string, unknown> => {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return value as Record<
        string,
        unknown
      >;
    }
  
    return {};
  };
  
  export const getBoolean = (
    value: unknown,
    fallback: boolean
  ): boolean => {
    if (typeof value === "boolean") {
      return value;
    }
  
    if (value === "true") {
      return true;
    }
  
    if (value === "false") {
      return false;
    }
  
    return fallback;
  };
  
  export const getString = (
    value: unknown,
    fallback = ""
  ): string => {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  
    return fallback;
  };
  
  export const getNumber = (
    value: unknown,
    fallback: number
  ): number => {
    const parsed = Number(value);
  
    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  };
  
  export const getSectionSettings = (
    section?:
      | StorefrontSection
      | null
  ): Record<string, unknown> => {
    return asRecord(
      section?.settings
    );
  };
  
  export const getSectionContent = (
    section?:
      | StorefrontSection
      | null
  ): Record<string, unknown> => {
    return asRecord(
      section?.content
    );
  };