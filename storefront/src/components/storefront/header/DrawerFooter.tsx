"use client";

import Link from "next/link";

interface DrawerFooterProps {
  open: boolean;
  accountUrl: string;
  onNavigate: () => void;
}

const footerItems = [
  {
    href: "/account/orders",
    label: "Your Orders",
  },
  {
    href: "/wishlist",
    label: "Your Wishlist",
  },
  {
    href: "/contact",
    label: "Customer Service",
  },
];

export default function DrawerFooter({
  open,
  accountUrl,
  onNavigate,
}: DrawerFooterProps) {
  return (
    <section className="border-t border-slate-200 py-4">
      <h3 className="px-6 pb-2 text-lg font-extrabold text-slate-950">
        Help &amp; Settings
      </h3>

      <nav aria-label="Help and settings">
        <Link
          href={accountUrl}
          onClick={onNavigate}
          tabIndex={open ? 0 : -1}
          className="block px-6 py-2.5 text-[15px] font-medium text-slate-800 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
        >
          Your Account
        </Link>

        {footerItems.map(
          ({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              tabIndex={
                open ? 0 : -1
              }
              className="block px-6 py-2.5 text-[15px] font-medium text-slate-800 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
            >
              {label}
            </Link>
          )
        )}
      </nav>
    </section>
  );
}