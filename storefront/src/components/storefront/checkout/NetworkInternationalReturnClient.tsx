"use client";

import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  clearCart,
} from "@/store/slices/cartSlice";

import {
  selectCustomerAccessToken,
  selectCustomerAuthenticated,
} from "@/store/slices/customerAuthSlice";

import {
  reconcileNetworkInternationalPayment,
} from "@/lib/payments/networkInternationalApi";

type ReturnState =
  | "CHECKING"
  | "SUCCESS"
  | "PENDING"
  | "FAILED";

export default function NetworkInternationalReturnClient() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const dispatch =
    useAppDispatch();

  const authenticated =
    useAppSelector(
      selectCustomerAuthenticated
    );

  const accessToken =
    useAppSelector(
      selectCustomerAccessToken
    );

  const [
    state,
    setState,
  ] =
    useState<ReturnState>(
      "CHECKING"
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      "Confirming your payment securely…"
    );

  const orderIdFromUrl =
    searchParams.get(
      "orderId"
    );

  useEffect(
    () => {
      let cancelled =
        false;

      const verify =
        async () => {
          let orderId =
            orderIdFromUrl;

          if (
            !orderId
          ) {
            try {
              orderId =
                window.localStorage.getItem(
                  "myshops_pending_network_order_id"
                );
            } catch {
              orderId =
                null;
            }
          }

          if (
            !orderId
          ) {
            if (
              !cancelled
            ) {
              setState(
                "FAILED"
              );

              setMessage(
                "We could not identify the order to verify."
              );
            }

            return;
          }

          try {
            const result =
              await reconcileNetworkInternationalPayment({
                orderId,

                accessToken:
                  authenticated
                    ? accessToken
                    : null,
              });

            if (
              cancelled
            ) {
              return;
            }

            const paymentStatus =
              String(
                result.data
                  .order
                  .paymentStatus ||
                ""
              )
                .trim()
                .toUpperCase();

            if (
              paymentStatus ===
                "PAID" ||
              paymentStatus ===
                "AUTHORIZED"
            ) {
              setState(
                "SUCCESS"
              );

              setMessage(
                "Payment confirmed. Redirecting to your order confirmation…"
              );

              dispatch(
                clearCart()
              );

              try {
                window.localStorage.removeItem(
                  "myshops_pending_network_order_id"
                );
              } catch {
                // Ignore storage cleanup errors.
              }

              window.setTimeout(
                () => {
                  router.replace(
                    `/order-success/${orderId}`
                  );
                },
                700
              );

              return;
            }

            if (
              paymentStatus ===
              "FAILED"
            ) {
              setState(
                "FAILED"
              );

              setMessage(
                "The payment was not completed. Your order remains pending."
              );

              return;
            }

            setState(
              "PENDING"
            );

            setMessage(
              "Network International has not confirmed the payment yet. You can check again safely."
            );
          } catch (
            error
          ) {
            console.error(
              "Network International return reconciliation failed:",
              error
            );

            if (
              !cancelled
            ) {
              setState(
                "PENDING"
              );

              setMessage(
                error instanceof
                  Error
                  ? error.message
                  : "We could not confirm the payment yet."
              );
            }
          }
        };

      void verify();

      return () => {
        cancelled =
          true;
      };
    },
    [
      orderIdFromUrl,
      authenticated,
      accessToken,
      dispatch,
      router,
    ]
  );

  return (
    <div className="mx-auto flex min-h-[55vh] w-full max-w-xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-storefront-border-light bg-white p-7 text-center shadow-[0_8px_30px_rgba(17,24,39,0.05)] sm:p-9">
        {state ===
        "CHECKING" ? (
          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-storefront-primary"
          />
        ) : state ===
          "SUCCESS" ? (
          <CheckCircle2
            size={38}
            className="mx-auto text-emerald-600"
          />
        ) : (
          <CircleAlert
            size={38}
            className="mx-auto text-amber-600"
          />
        )}

        <h1 className="mt-5 text-xl font-bold text-storefront-text">
          {state ===
          "CHECKING"
            ? "Checking payment"
            : state ===
                "SUCCESS"
              ? "Payment confirmed"
              : state ===
                  "FAILED"
                ? "Payment not completed"
                : "Payment pending"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-storefront-muted">
          {message}
        </p>

        {state ===
        "PENDING" ? (
          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 h-11 rounded-storefront-button bg-storefront-primary px-6 text-sm font-bold text-white transition hover:opacity-90"
          >
            Check payment again
          </button>
        ) : null}

        {state ===
        "FAILED" ? (
          <button
            type="button"
            onClick={() =>
              router.replace(
                "/checkout"
              )
            }
            className="mt-6 h-11 rounded-storefront-button border border-storefront-border-light bg-white px-6 text-sm font-bold text-storefront-text transition hover:bg-[#FAFAFA]"
          >
            Return to checkout
          </button>
        ) : null}
      </div>
    </div>
  );
}
