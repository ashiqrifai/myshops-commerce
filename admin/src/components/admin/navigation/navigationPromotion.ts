import type {
    NavigationPromotionSettings,
  } from "@/types/navigation";
  
  export const defaultNavigationPromotionSettings: NavigationPromotionSettings =
  {
    eyebrow: null,
  
    title: null,
  
    subtitle: null,
  
    description: null,
  
    ctaText: "Shop now",
  
    ctaUrl: null,
  
    textAlign: "LEFT",
  
    overlay: "DARK",
  
    textColor: "#FFFFFF",
  
    backgroundColor: "#303030",
  };
  
  export function getPromotionSettings(
    settings?: {
      promotion?: NavigationPromotionSettings;
    } | null
  ): NavigationPromotionSettings {
    return {
      ...defaultNavigationPromotionSettings,
  
      ...(settings?.promotion || {}),
    };
  }