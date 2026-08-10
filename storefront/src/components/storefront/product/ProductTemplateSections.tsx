import SectionRenderer from "@/components/storefront/SectionRenderer";
import type { StorefrontSection } from "@/types/storefront";

interface ProductTemplateSectionsProps {
  sections: StorefrontSection[];
}

const isPublishedNow = (section: StorefrontSection) => {
  const now = Date.now();
  const startsAt = section.publishStartAt
    ? new Date(section.publishStartAt).getTime()
    : null;
  const endsAt = section.publishEndAt
    ? new Date(section.publishEndAt).getTime()
    : null;

  if (startsAt && Number.isFinite(startsAt) && startsAt > now) {
    return false;
  }

  if (endsAt && Number.isFinite(endsAt) && endsAt < now) {
    return false;
  }

  return true;
};

export default function ProductTemplateSections({
  sections,
}: ProductTemplateSectionsProps) {
  const visibleSections = [...(sections || [])]
    .filter((section) => section.visibility?.desktop !== false)
    .filter(isPublishedNow)
    .sort((first, second) => first.displayOrder - second.displayOrder);

  if (!visibleSections.length) {
    return null;
  }

  return (
    <div data-product-template-sections>
      {visibleSections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
        />
      ))}
    </div>
  );
}
