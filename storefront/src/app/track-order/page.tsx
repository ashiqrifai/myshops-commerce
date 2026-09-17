import {
  Suspense,
} from "react";

import TrackOrderClient from "./TrackOrderClient";

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl px-4 py-16 text-center text-sm text-storefront-muted sm:px-6 lg:px-8">
          Loading order tracking…
        </div>
      }
    >
      <TrackOrderClient />
    </Suspense>
  );
}