"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  reconcileTamaraPayment,
} from "@/lib/payments/tamaraApi";

type Props = {
  orderId:
    string | null;
};

export default function TamaraFailureClient({
  orderId,
}: Props) {
  const router =
    useRouter();

  const [
    message,
    setMessage,
  ] = useState(
    "Checking payment status..."
  );

  useEffect(() => {
    if (!orderId) {
      setMessage(
        "Tamara payment was not completed."
      );

      return;
    }

    let cancelled =
      false;

    const reconcile =
      async () => {
        try {
          const result =
            await reconcileTamaraPayment(
              orderId
            );

          if (cancelled) {
            return;
          }

          /*
           * Do not trust the failure URL alone.
           *
           * If Tamara confirms the payment
           * actually succeeded, move the
           * customer into the success flow.
           */
          if (
            result.success &&
            result.successfulCheckout
          ) {
            router.replace(
              `/checkout/tamara/success?orderId=${encodeURIComponent(
                orderId
              )}`
            );

            return;
          }

          setMessage(
            "Tamara payment was not completed. Your cart is still available."
          );
        } catch (error) {
          console.error(
            "Tamara failure reconciliation failed:",
            error
          );

          if (!cancelled) {
            setMessage(
              "Tamara payment was not completed. Your cart is still available."
            );
          }
        }
      };

    void reconcile();

    return () => {
      cancelled =
        true;
    };
  }, [
    orderId,
    router,
  ]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-16">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">
          Payment Not Completed
        </h1>

        <p className="mt-4 text-gray-600">
          {message}
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/checkout"
            )
          }
          className="mt-6 rounded-lg bg-black px-5 py-3 text-white"
        >
          Return to checkout
        </button>
      </div>
    </main>
  );
}