import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type {
  PublicCategoryBreadcrumb,
} from "@/types/publicCategory";

export default function CategoryBreadcrumbs({
  items,
}: {
  items: PublicCategoryBreadcrumb[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-storefront-muted"
    >
      <Link
        href="/"
        className="transition hover:text-storefront-primary"
      >
        Home
      </Link>

      {items.map(
        (item, index) => (
          <span
            key={item.id}
            className="flex items-center gap-1.5"
          >
            <ChevronRight
              size={13}
            />

            {index ===
            items.length - 1 ? (
              <span className="font-semibold text-storefront-text">
                {item.name}
              </span>
            ) : (
              <Link
                href={`/category/${item.slug}`}
                className="transition hover:text-storefront-primary"
              >
                {item.name}
              </Link>
            )}
          </span>
        )
      )}
    </nav>
  );
}
