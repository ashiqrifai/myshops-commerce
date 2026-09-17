"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { clearCart } from "@/store/slices/cartSlice";
import { reconcileTabbyPayment } from "@/lib/payments/tabbyApi";

export default function TabbySuccessClient() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState("Confirming your Tabby payment…");

  useEffect(() => {
    const orderId = params.get("orderId");

    if (!orderId) {
      setMessage("Order reference is missing.");
      return;
    }

    reconcileTabbyPayment(orderId)
      .then((result) => {
        if (!result.successfulCheckout) {
          throw new Error("Tabby payment has not been confirmed yet.");
        }

        dispatch(clearCart());
        router.replace(`/order-success/${orderId}`);
      })
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to confirm Tabby payment."
        );
      });
  }, [dispatch, params, router]);

  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <h1 className="text-2xl font-black text-storefront-text">Tabby payment</h1>
      <p className="mt-3 text-sm text-storefront-muted">{message}</p>
    </div>
  );
}
