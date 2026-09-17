"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  useAppDispatch,
} from "@/store/hooks";

import {
  clearCart,
} from "@/store/slices/cartSlice";

import {
  reconcileTabbyPayment,
} from "@/lib/payments/tabbyApi";

const STORAGE_KEY =
  "myshops_pending_tabby_order_id";

export default function TabbyPendingOrderRecovery() {
  const dispatch =
    useAppDispatch();

  const runningRef =
    useRef(
      false
    );

  useEffect(
    () => {
      if (
        runningRef.current
      ) {
        return;
      }

      let cancelled =
        false;

      const recover =
        async () => {
          let orderId:
            string | null =
            null;

          try {
            orderId =
              window.localStorage.getItem(
                STORAGE_KEY
              );
          } catch (
            storageError
          ) {
            console.warn(
              "Unable to read pending Tabby order id:",
              storageError
            );

            return;
          }

          if (
            !orderId
          ) {
            return;
          }

          runningRef.current =
            true;

          try {
            /*
             * The backend call is authoritative.
             *
             * It retrieves the payment from Tabby and, if the
             * payment is still AUTHORIZED, performs the immediate
             * full capture before returning the final state.
             */
            const result =
              await reconcileTabbyPayment(
                orderId
              );

            if (
              cancelled
            ) {
              return;
            }

            const paymentStatus =
              String(
                result
                  .paymentStatus ||
                ""
              ).toUpperCase();

            const tabbyStatus =
              String(
                result
                  .tabbyStatus ||
                ""
              ).toUpperCase();

            /*
             * PAID/CLOSED:
             * The order completed through Tabby (possibly entirely
             * through the webhook while the browser was closed).
             * The stale local browser cart must now be removed.
             */
            if (
              paymentStatus ===
                "PAID" ||
              tabbyStatus ===
                "CLOSED"
            ) {
              dispatch(
                clearCart()
              );

              try {
                window.localStorage.removeItem(
                  STORAGE_KEY
                );
              } catch (
                storageError
              ) {
                console.warn(
                  "Unable to remove completed Tabby order id:",
                  storageError
                );
              }

              return;
            }

            /*
             * FAILED / REJECTED / EXPIRED:
             * Keep the cart so the customer can retry using another
             * payment method, but stop treating this order as pending.
             */
            if (
              paymentStatus ===
                "FAILED" ||
              tabbyStatus ===
                "REJECTED" ||
              tabbyStatus ===
                "EXPIRED"
            ) {
              try {
                window.localStorage.removeItem(
                  STORAGE_KEY
                );
              } catch (
                storageError
              ) {
                console.warn(
                  "Unable to remove failed Tabby order id:",
                  storageError
                );
              }

              return;
            }

            /*
             * CREATED / PENDING / AUTHORIZED:
             * Keep the key.
             *
             * AUTHORIZED normally becomes CLOSED in the same backend
             * request because immediate capture is enabled. Keeping
             * the key for any non-final result allows another check
             * on a later storefront visit.
             */
          } catch (
            error
          ) {
            /*
             * Do not clear the cart and do not remove the key when
             * status cannot be verified. A later page load can retry.
             */
            console.warn(
              "Unable to reconcile pending Tabby order:",
              error
            );
          } finally {
            runningRef.current =
              false;
          }
        };

      void recover();

      /*
       * Also check again if the customer returns to this tab/window
       * after it was backgrounded.
       */
      const onVisibilityChange =
        () => {
          if (
            document.visibilityState ===
              "visible" &&
            !runningRef.current
          ) {
            void recover();
          }
        };

      document.addEventListener(
        "visibilitychange",
        onVisibilityChange
      );

      return () => {
        cancelled =
          true;

        document.removeEventListener(
          "visibilitychange",
          onVisibilityChange
        );
      };
    },
    [
      dispatch,
    ]
  );

  return null;
}
