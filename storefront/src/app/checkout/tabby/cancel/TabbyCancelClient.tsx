"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function TabbyCancelClient() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <h1 className="text-2xl font-black text-storefront-text">Tabby payment cancelled</h1>
      <p className="mt-3 text-sm text-storefront-muted">
        Your payment was not completed. Your order remains pending.
      </p>
      <button
        type="button"
        onClick={() => router.replace(orderId ? `/checkout?retryOrderId=${encodeURIComponent(orderId)}` : "/checkout")}
        className="mt-6 rounded-xl bg-[#111111] px-6 py-3 text-sm font-black text-white"
      >
        Return to checkout
      </button>
    </div>
  );
}
