import Link from "next/link";

import type {
  StorefrontData,
} from "@/types/storefront";

interface StorefrontFooterProps {
  storefront:
    StorefrontData;
}

const footerGroups = [
  {
    title:
      "SHOP",

    links: [
      [
        "Mobile Phones",
        "/category/mobile-phones",
      ],
      [
        "Laptops & Tablets",
        "/category/laptops",
      ],
      [
        "Accessories",
        "/category/accessories",
      ],
      [
        "Gaming",
        "/category/gaming",
      ],
      [
        "Wearables",
        "/category/wearables",
      ],
      [
        "Cameras",
        "/category/cameras",
      ],
    ],
  },
  {
    title:
      "ACCOUNT",

    links: [
      [
        "My Account",
        "/account",
      ],
      [
        "Orders",
        "/account/orders",
      ],
      [
        "Wishlist",
        "/wishlist",
      ],
      [
        "Track Order",
        "/account/orders",
      ],
      [
        "Returns",
        "/returns",
      ],
    ],
  },
  {
    title:
      "INFO",

    links: [
      [
        "About Us",
        "/about",
      ],
      [
        "Blog",
        "/blog",
      ],
      [
        "Careers",
        "/careers",
      ],
      [
        "Press",
        "/press",
      ],
      [
        "Sitemap",
        "/sitemap",
      ],
      [
        "Store",
        "/stores",
      ],
    ],
  },
  {
    title:
      "HELP",

    links: [
      [
        "FAQ",
        "/faq",
      ],
      [
        "Contact Us",
        "/contact",
      ],
      [
        "Delivery Info",
        "/delivery",
      ],
      [
        "Privacy Policy",
        "/privacy",
      ],
      [
        "Terms",
        "/terms",
      ],
    ],
  },
] as const;

export default function StorefrontFooter({
  storefront,
}: StorefrontFooterProps) {
  const displayName =
    storefront.settings
      .company
      ?.displayName ||
    storefront.company.name;

  const logoUrl =
    storefront.settings
      .company
      ?.logoUrl ||
    storefront.company
      .logoUrl ||
    null;

  return (
    <footer className="mt-auto border-t-[10px] border-storefront-primary bg-[#0B0C17] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,1fr)]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    logoUrl
                  }
                  alt={
                    displayName
                  }
                  className="max-h-12 w-auto max-w-52 object-contain brightness-0 invert"
                />
              ) : (
                <span className="text-3xl font-black tracking-tight">
                  {
                    displayName
                  }
                </span>
              )}
            </Link>

            <p className="mt-5 max-w-md text-sm font-medium leading-7 text-white/80">
              Your one-stop destination for the latest mobiles, electronics and gadgets in the UAE. Fast delivery across Dubai, Abu Dhabi and Sharjah.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {[
                "f",
                "◎",
                "◉",
                "in",
                "𝕏",
              ].map(
                (
                  icon,
                  index
                ) => (
                  <a
                    key={
                      `${icon}-${index}`
                    }
                    href="#"
                    aria-label="Social media"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-storefront-primary text-sm font-black text-white transition hover:-translate-y-0.5"
                  >
                    {
                      icon
                    }
                  </a>
                )
              )}
            </div>
          </div>

          {footerGroups.map(
            (group) => (
              <div
                key={
                  group.title
                }
              >
                <h3 className="text-sm font-black uppercase tracking-wide text-white">
                  {
                    group.title
                  }
                </h3>

                <div className="mt-5 space-y-3">
                  {group.links.map(
                    (
                      [
                        label,
                        href,
                      ]
                    ) => (
                      <Link
                        key={
                          label
                        }
                        href={
                          href
                        }
                        className="block text-sm font-medium text-white/75 transition hover:text-storefront-primary"
                      >
                        {
                          label
                        }
                      </Link>
                    )
                  )}
                </div>
              </div>
            )
          )}
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-7 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-white/55">
            ©{" "}
            {new Date().getFullYear()}{" "}
            {displayName}. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {[
              "PayPal",
              "VISA",
              "DISCOVER",
              "AMEX",
              "VISA",
              "XOOM",
            ].map(
              (
                payment,
                index
              ) => (
                <span
                  key={
                    `${payment}-${index}`
                  }
                  className="inline-flex h-7 items-center rounded bg-white px-2 text-[9px] font-black text-[#0B0C17]"
                >
                  {
                    payment
                  }
                </span>
              )
            )}
          </div>
        </div>
      </div>

      <div className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 rounded-l-xl bg-[#0B0C17] px-2 py-5 text-[10px] font-bold text-white/80 shadow-lg xl:block [writing-mode:vertical-rl]">
        *T&amp;C Apply
      </div>
    </footer>
  );
}
