import type {
  Metadata,
} from "next";

import {
  Suspense,
} from "react";

import NetworkInternationalReturnClient from "@/components/storefront/checkout/NetworkInternationalReturnClient";

export const metadata: Metadata = {
  title:
    "Payment Confirmation",

  robots: {
    index:
      false,

    follow:
      false,
  },
};

export default function NetworkInternationalReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-sm text-storefront-muted">
          Confirming payment…
        </div>
      }
    >
      <NetworkInternationalReturnClient />
    </Suspense>
  );
}
