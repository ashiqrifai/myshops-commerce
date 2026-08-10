import type {
    StorefrontSection,
  } from "@/types/storefront";
  
  const normalizeSectionTypeCode = (
    section: StorefrontSection
  ): string => {
    return String(
      section.type?.code || ""
    )
      .trim()
      .toUpperCase();
  };
  
  export interface GlobalStorefrontSections {
    announcementSection:
      | StorefrontSection
      | null;
  
    headerSection:
      | StorefrontSection
      | null;
  
    navigationSection:
      | StorefrontSection
      | null;
  
    footerSection:
      | StorefrontSection
      | null;
  
    pageSections: StorefrontSection[];
  }
  
  export function splitGlobalStorefrontSections(
    sections?:
      | StorefrontSection[]
      | null
  ): GlobalStorefrontSections {
    const result: GlobalStorefrontSections = {
      announcementSection: null,
      headerSection: null,
      navigationSection: null,
      footerSection: null,
      pageSections: [],
    };
  
    for (const section of sections || []) {
      const sectionTypeCode =
        normalizeSectionTypeCode(
          section
        );
  
      switch (sectionTypeCode) {
        case "ANNOUNCEMENT_BAR":
          result.announcementSection =
            section;
          break;
  
        case "HEADER":
          result.headerSection =
            section;
          break;
  
        case "NAVIGATION":
          result.navigationSection =
            section;
          break;
  
        case "FOOTER":
          result.footerSection =
            section;
          break;
  
        default:
          result.pageSections.push(
            section
          );
          break;
      }
    }
  
    return result;
  }