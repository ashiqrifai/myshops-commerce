import SectionRenderer from "./SectionRenderer";

import type {
  StorefrontPage,
} from "@/types/storefront";

interface PageRendererProps {
  page: StorefrontPage;
}

export default function PageRenderer({
  page,
}: PageRendererProps) {
  const visibleSections = [
    ...(page.sections || []),
  ]
    .filter(
      (section) =>
        section.visibility
          ?.desktop !== false
    )
    .sort(
      (
        first,
        second
      ) =>
        first.displayOrder -
        second.displayOrder
    );

  /*
  |--------------------------------------------------------------------------
  | Empty State
  |--------------------------------------------------------------------------
  */

  if (
    !visibleSections.length
  ) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-2xl rounded-storefront-card border border-storefront bg-storefront-surface p-8 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-storefront-secondary text-2xl">
            🛍️
          </div>

          <h1 className="mt-5 text-2xl font-bold text-storefront-text sm:text-3xl">
            {page.title ||
              page.name}
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-storefront-muted sm:text-base">
            {page.description ||
              "The storefront homepage is ready. Add and publish CMS sections to begin rendering the website."}
          </p>

          <div className="mt-6 rounded-storefront-button bg-storefront-secondary px-4 py-3 text-sm text-storefront-muted">
            No published sections are
            currently available for
            this page.
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Homepage Sections
  |--------------------------------------------------------------------------
  |
  | gap-4 = 16px
  |
  | This is now the standard vertical space
  | between every CMS section.
  |
  |--------------------------------------------------------------------------
  */

  return (
    <main
      className="
        flex
        flex-1
        flex-col
        gap-4
      "
    >
      {visibleSections.map(
        (section) => (
          <SectionRenderer
            key={
              section.id
            }
            section={
              section
            }
          />
        )
      )}
    </main>
  );
}