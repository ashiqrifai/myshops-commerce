"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAppDispatch,
} from "@/store/hooks";

import {
  clearCart,
} from "@/store/slices/cartSlice";

import {
  reconcileTamaraPayment,
} from "@/lib/payments/tamaraApi";

type Props = {
  orderId:
    string | null;
};

export default function TamaraSuccessClient({
  orderId,
}: Props) {
  const router =
    useRouter();

  const dispatch =
    useAppDispatch();

  const [
    message,
    setMessage,
  ] = useState(
    "Confirming your Tamara payment..."
  );

  const [
    failed,
    setFailed,
  ] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setFailed(true);

      setMessage(
        "Order reference is missing."
      );

      return;
    }

    let cancelled =
      false;

    const reconcile =
      async () => {
        try {
          const response =
            await reconcileTamaraPayment(
              orderId
            );

          if (cancelled) {
            return;
          }

          if (
            response.success &&
            response.successfulCheckout
          ) {
            dispatch(
              clearCart()
            );

            router.replace(
              `/order-success/${encodeURIComponent(
                orderId
              )}`
            );

            return;
          }

          setFailed(true);

          setMessage(
            "Tamara has not confirmed this payment yet."
          );
        } catch (error) {
          console.error(
            "Tamara reconcile error:",
            error
          );

          if (!cancelled) {
            setFailed(true);

            setMessage(
              "We could not confirm the Tamara payment. Your order has not been lost."
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
    dispatch,
    router,
  ]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-16">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">
          {failed
            ? "Payment Status"
            : "Confirming Payment"}
        </h1>

        <p className="mt-4 text-gray-600">
          {message}
        </p>

        {failed ? (
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