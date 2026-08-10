/*
 * SECTION RENDERER PATCH
 * ======================
 *
 * Add this import:
 */

import FlashDealsSection from "@/components/storefront/sections/FlashDealsSection";

/*
 * Add this switch case:
 */

case "FLASH_DEALS":
  return (
    <FlashDealsSection
      section={section}
    />
  );
