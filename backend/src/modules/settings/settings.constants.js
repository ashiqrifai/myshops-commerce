const SETTING_CHANNELS = [
    "GLOBAL",
    "ADMIN",
    "WEBSITE",
    "KIOSK",
  ];
  
  const SETTING_DATA_TYPES = [
    "STRING",
    "NUMBER",
    "BOOLEAN",
    "COLOR",
    "IMAGE",
    "URL",
    "EMAIL",
    "JSON",
    "SELECT",
  ];
  
  const SETTING_GROUPS = [
    "company",
    "theme",
    "website",
    "kiosk",
    "commerce",
    "contact",
    "social",
    "seo",
  ];
  
  const BOOLEAN_SETTING_KEYS = new Set([
    "website.wishlistEnabled",
    "website.comparisonEnabled",
    "website.reviewsEnabled",
    "website.recentlyViewedEnabled",
    "website.guestCheckoutEnabled",
    "website.aiAssistantEnabled",
    "website.showInventory",
    "website.showLowStock",
    "kiosk.aiAssistantEnabled",
    "kiosk.cartEnabled",
    "kiosk.qrHandoffEnabled",
    "kiosk.voiceInputEnabled",
    "kiosk.textToSpeechEnabled",
    "kiosk.showInventory",
    "kiosk.autoSessionResetEnabled",
    "commerce.taxInclusive",
    "commerce.allowBackorders",
  ]);
  
  const NUMBER_SETTING_KEYS = new Set([
    "theme.buttonRadius",
    "theme.cardRadius",
    "kiosk.idleTimeoutSeconds",
    "kiosk.sessionResetSeconds",
    "kiosk.heartbeatIntervalSeconds",
    "commerce.lowStockThreshold",
  ]);
  
  const COLOR_SETTING_KEYS = new Set([
    "theme.primaryColor",
    "theme.secondaryColor",
    "theme.accentColor",
    "theme.backgroundColor",
    "theme.surfaceColor",
    "theme.textColor",
    "theme.mutedTextColor",
    "theme.borderColor",
  ]);
  
  module.exports = {
    SETTING_CHANNELS,
    SETTING_DATA_TYPES,
    SETTING_GROUPS,
    BOOLEAN_SETTING_KEYS,
    NUMBER_SETTING_KEYS,
    COLOR_SETTING_KEYS,
  };