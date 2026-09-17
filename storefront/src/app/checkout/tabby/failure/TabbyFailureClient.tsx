"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function TabbyFailureClient() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <h1 className="text-2xl font-black text-storefront-text">Tabby payment unsuccessful</h1>
      <p className="mt-3 text-sm text-storefront-muted">
        Tabby could not complete this payment. Please return to checkout and choose another payment method or try again.
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
