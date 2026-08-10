import type {
    CSSProperties,
  } from "react";
  
  import type {
    StorefrontThemeSettings,
  } from "@/types/storefront";
  
  export interface StorefrontCssVariables
    extends CSSProperties {
    "--storefront-primary"?: string;
    "--storefront-secondary"?: string;
    "--storefront-accent"?: string;
    "--storefront-background"?: string;
    "--storefront-surface"?: string;
    "--storefront-text"?: string;
    "--storefront-muted-text"?: string;
    "--storefront-border"?: string;
    "--storefront-font-family"?: string;
    "--storefront-button-radius"?: string;
    "--storefront-card-radius"?: string;
  }
  
  export function buildStorefrontThemeVariables(
    theme?: StorefrontThemeSettings
  ): StorefrontCssVariables {
    return {
      "--storefront-primary":
        theme?.primaryColor ||
        "#FF5500",
  
      "--storefront-secondary":
        theme?.secondaryColor ||
        "#F4F4F4",
  
      "--storefront-accent":
        theme?.accentColor ||
        "#0066FF",
  
      "--storefront-background":
        theme?.backgroundColor ||
        "#FFFFFF",
  
      "--storefront-surface":
        theme?.surfaceColor ||
        "#FFFFFF",
  
      "--storefront-text":
        theme?.textColor ||
        "#111111",
  
      "--storefront-muted-text":
        theme?.mutedTextColor ||
        "#6B7280",
  
      "--storefront-border":
        theme?.borderColor ||
        "#E5E7EB",
  
      "--storefront-font-family":
        theme?.fontFamily ||
        "Inter, Arial, sans-serif",
  
      "--storefront-button-radius":
        `${theme?.buttonRadius ?? 8}px`,
  
      "--storefront-card-radius":
        `${theme?.cardRadius ?? 12}px`,
    };
  }