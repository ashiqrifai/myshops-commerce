import CategoryBreadcrumbs from "./CategoryBreadcrumbs";
import CategoryFilters from "./CategoryFilters";
import CategoryHero from "./CategoryHero";
import CategoryPagination from "./CategoryPagination";
import CategoryProductGrid from "./CategoryProductGrid";
import CategoryToolbar from "./CategoryToolbar";
import SubcategoryGrid from "./SubcategoryGrid";

import type {
  PublicCategoryData,
} from "@/types/publicCategory";

export default function CategoryPage({
  data,
  currentQuery,
}: {
  data: PublicCategoryData;

  currentQuery: Record<
    string,
    string | string[] | undefined
  >;
}) {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <CategoryBreadcrumbs
        items={data.breadcrumbs}
      />

      <CategoryHero
        category={data.category}
      />

      <SubcategoryGrid
        categories={data.children}
      />

      <section className="mt-9">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-2xl border border-storefront-border-light bg-storefront-surface p-5 lg:sticky lg:top-24 lg:block">
            <CategoryFilters
              filters={data.filters}
            />
          </aside>

          <div className="min-w-0">
            <CategoryToolbar
              totalItems={
                data.pagination
                  .totalItems
              }
              sortOptions={
                data.sortOptions
              }
              filters={
                data.filters
              }
            />

            <CategoryProductGrid
              products={
                data.products
              }
            />

            <CategoryPagination
              pagination={
                data.pagination
              }
              currentQuery={
                currentQuery
              }
            />
          </div>
        </div>
      </section>

      {data.category.description ? (
        <section className="mt-10 rounded-2xl border border-storefront-border-light bg-storefront-surface p-6 sm:p-8">
          <h2 className="text-xl font-black text-storefront-text">
            About{" "}
            {data.category.name}
          </h2>

          <div className="mt-3 whitespace-pre-line text-sm leading-7 text-storefront-muted">
            {
              data.category
                .description
            }
          </div>
        </section>
      ) : null}
    </main>
  );
}
