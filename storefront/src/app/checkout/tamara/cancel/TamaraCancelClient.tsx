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

export default function TamaraCancelClient({
  orderId,
}: Props) {
  const router =
    useRouter();

  const [
    checking,
    setChecking,
  ] = useState(
    Boolean(orderId)
  );

  const [
    message,
    setMessage,
  ] = useState(
    orderId
      ? "Please wait while we confirm the payment status."
      : "Tamara payment was cancelled."
  );

  useEffect(() => {
    if (!orderId) {
      setChecking(false);

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
           * Do not trust the cancel URL itself.
           *
           * If Tamara says payment actually
           * succeeded, send the customer through
           * the success flow.
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
            "Your Tamara payment was cancelled. Your cart has been kept, so you can return to checkout and try again."
          );

          setChecking(false);
        } catch (error) {
          console.error(
            "Tamara cancel reconciliation failed:",
            error
          );

          if (cancelled) {
            return;
          }

          setMessage(
            "Your Tamara payment was not completed. Your cart has been kept."
          );

          setChecking(false);
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
          {checking
            ? "Checking Payment"
            : "Tamara Payment Cancelled"}
        </h1>

        <p className="mt-4 text-gray-600">
          {message}
        </p>

        {!checking ? (
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
        ) : null}
      </div>
    </main>
  );
}