"use client";

import {
  CircleAlert,
  Plus,
  RefreshCcw,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  clearCustomerAuth,
  selectCustomerAccessToken,
  setCustomerAuth,
} from "@/store/slices/customerAuthSlice";

import {
  clearCustomerAuthStorage,
} from "@/store/customerAuthStorage";

import {
  refreshCustomer,
} from "@/lib/customer-auth/customerAuthApi";

import {
  createCustomerAddress,
  CustomerAddressApiError,
  deleteCustomerAddress,
  listCustomerAddresses,
  setDefaultBillingAddress,
  setDefaultShippingAddress,
  updateCustomerAddress,
} from "@/lib/customer-addresses/customerAddressApi";

import {
  CUSTOMER_MESSAGES,
} from "@/constants/customerMessages";

import type {
  CustomerAddress,
  CustomerAddressFieldError,
  CustomerAddressInput,
} from "@/types/customerAddress";

import AddressCard from "./AddressCard";
import AddressDeleteDialog from "./AddressDeleteDialog";
import AddressEmptyState from "./AddressEmptyState";
import AddressModal from "./AddressModal";
import AddressSkeleton from "./AddressSkeleton";
import InlineToast from "@/components/ui/InlineToast";

export default function CustomerAddressesPageContent() {
  const router =
    useRouter();

  const dispatch =
    useAppDispatch();

  const accessToken =
    useAppSelector(
      selectCustomerAccessToken
    );

  const [
    addresses,
    setAddresses,
  ] =
    useState<
      CustomerAddress[]
    >(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    busy,
    setBusy,
  ] =
    useState(
      false
    );

  const [
    loadError,
    setLoadError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(
      false
    );

  const [
    editingAddress,
    setEditingAddress,
  ] =
    useState<
      CustomerAddress |
      null
    >(
      null
    );

  const [
    deletingAddress,
    setDeletingAddress,
  ] =
    useState<
      CustomerAddress |
      null
    >(
      null
    );

  const [
    serverErrors,
    setServerErrors,
  ] =
    useState<
      CustomerAddressFieldError[]
    >(
      []
    );

  const [
    toast,
    setToast,
  ] =
    useState<
      | {
          tone:
            "success" |
            "error" |
            "info";
          message:
            string;
        }
      | null
    >(
      null
    );

  const expireSession =
    useCallback(
      () => {
        dispatch(
          clearCustomerAuth()
        );

        clearCustomerAuthStorage();

        router.replace(
          "/account/login?returnUrl=%2Faccount%2Faddresses"
        );
      },
      [
        dispatch,
        router,
      ]
    );

  const withValidToken =
    useCallback(
      async <T,>(
        operation:
          (
            token:
              string
          ) =>
            Promise<T>
      ): Promise<T> => {
        if (
          !accessToken
        ) {
          expireSession();

          throw new Error(
            CUSTOMER_MESSAGES
              .SESSION_EXPIRED
          );
        }

        try {
          return await operation(
            accessToken
          );
        } catch (
          error
        ) {
          if (
            error instanceof
              CustomerAddressApiError &&
            error.status ===
              401
          ) {
            try {
              const refreshed =
                await refreshCustomer();

              dispatch(
                setCustomerAuth({
                  customer:
                    refreshed.customer,

                  accessToken:
                    refreshed.accessToken,
                })
              );

              return await operation(
                refreshed.accessToken
              );
            } catch {
              expireSession();

              throw new Error(
                CUSTOMER_MESSAGES
                  .SESSION_EXPIRED
              );
            }
          }

          throw error;
        }
      },
      [
        accessToken,
        dispatch,
        expireSession,
      ]
    );

  const load =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setLoadError(
          null
        );

        try {
          const result =
            await withValidToken(
              (
                token
              ) =>
                listCustomerAddresses(
                  token
                )
            );

          setAddresses(
            result
          );
        } catch (
          error
        ) {
          setLoadError(
            error instanceof
              Error
              ? error.message
              : CUSTOMER_MESSAGES
                  .ADDRESS_LOAD_FAILED
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        withValidToken,
      ]
    );

  useEffect(
    () => {
      void load();
    },
    [
      load,
    ]
  );

  const openCreate =
    () => {
      setEditingAddress(
        null
      );

      setServerErrors(
        []
      );

      setModalOpen(
        true
      );
    };

  const openEdit =
    (
      address:
        CustomerAddress
    ) => {
      setEditingAddress(
        address
      );

      setServerErrors(
        []
      );

      setModalOpen(
        true
      );
    };

  const save =
    async (
      input:
        CustomerAddressInput
    ) => {
      setBusy(
        true
      );

      setServerErrors(
        []
      );

      try {
        if (
          editingAddress
        ) {
          await withValidToken(
            (
              token
            ) =>
              updateCustomerAddress({
                accessToken:
                  token,

                addressId:
                  editingAddress.id,

                input,
              })
          );

          setToast({
            tone:
              "success",

            message:
              CUSTOMER_MESSAGES
                .ADDRESS_UPDATED,
          });
        } else {
          await withValidToken(
            (
              token
            ) =>
              createCustomerAddress({
                accessToken:
                  token,

                input,
              })
          );

          setToast({
            tone:
              "success",

            message:
              CUSTOMER_MESSAGES
                .ADDRESS_CREATED,
          });
        }

        setModalOpen(
          false
        );

        setEditingAddress(
          null
        );

        await load();
      } catch (
        error
      ) {
        if (
          error instanceof
            CustomerAddressApiError
        ) {
          setServerErrors(
            error.details
          );

          setToast({
            tone:
              "error",

            message:
              error.message,
          });
        } else {
          setToast({
            tone:
              "error",

            message:
              CUSTOMER_MESSAGES
                .ADDRESS_SAVE_FAILED,
          });
        }
      } finally {
        setBusy(
          false
        );
      }
    };

  const remove =
    async () => {
      if (
        !deletingAddress
      ) {
        return;
      }

      setBusy(
        true
      );

      try {
        await withValidToken(
          (
            token
          ) =>
            deleteCustomerAddress({
              accessToken:
                token,

              addressId:
                deletingAddress.id,
            })
        );

        setDeletingAddress(
          null
        );

        setToast({
          tone:
            "success",

          message:
            CUSTOMER_MESSAGES
              .ADDRESS_DELETED,
        });

        await load();
      } catch (
        error
      ) {
        setToast({
          tone:
            "error",

          message:
            error instanceof
              Error
              ? error.message
              : CUSTOMER_MESSAGES
                  .ADDRESS_DELETE_FAILED,
        });
      } finally {
        setBusy(
          false
        );
      }
    };

  const setShipping =
    async (
      address:
        CustomerAddress
    ) => {
      setBusy(
        true
      );

      try {
        await withValidToken(
          (
            token
          ) =>
            setDefaultShippingAddress({
              accessToken:
                token,

              addressId:
                address.id,
            })
        );

        setToast({
          tone:
            "success",

          message:
            CUSTOMER_MESSAGES
              .DEFAULT_SHIPPING_UPDATED,
        });

        await load();
      } catch (
        error
      ) {
        setToast({
          tone:
            "error",

          message:
            error instanceof
              Error
              ? error.message
              : CUSTOMER_MESSAGES
                  .ADDRESS_SAVE_FAILED,
        });
      } finally {
        setBusy(
          false
        );
      }
    };

  const setBilling =
    async (
      address:
        CustomerAddress
    ) => {
      setBusy(
        true
      );

      try {
        await withValidToken(
          (
            token
          ) =>
            setDefaultBillingAddress({
              accessToken:
                token,

              addressId:
                address.id,
            })
        );

        setToast({
          tone:
            "success",

          message:
            CUSTOMER_MESSAGES
              .DEFAULT_BILLING_UPDATED,
        });

        await load();
      } catch (
        error
      ) {
        setToast({
          tone:
            "error",

          message:
            error instanceof
              Error
              ? error.message
              : CUSTOMER_MESSAGES
                  .ADDRESS_SAVE_FAILED,
        });
      } finally {
        setBusy(
          false
        );
      }
    };

  return (
    <div>
      {toast ? (
        <InlineToast
          tone={
            toast.tone
          }
          message={
            toast.message
          }
          onClose={() =>
            setToast(
              null
            )
          }
        />
      ) : null}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
            Saved addresses
          </h1>

          <p className="mt-2 text-sm leading-6 text-storefront-muted">
            Manage your delivery and billing addresses.
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreate
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white"
        >
          <Plus
            size={
              17
            }
          />

          Add address
        </button>
      </div>

      {loading ? (
        <AddressSkeleton />
      ) : loadError ? (
        <div className="rounded-[22px] border border-red-200 bg-red-50 px-6 py-10 text-center">
          <CircleAlert
            size={
              32
            }
            className="mx-auto text-red-600"
          />

          <p className="mt-3 text-sm font-bold text-red-700">
            {
              loadError
            }
          </p>

          <button
            type="button"
            onClick={() =>
              void load()
            }
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-storefront-button border border-red-300 bg-white px-4 text-sm font-black text-red-700"
          >
            <RefreshCcw
              size={
                16
              }
            />

            Try again
          </button>
        </div>
      ) : addresses.length ===
        0 ? (
        <AddressEmptyState
          onAdd={
            openCreate
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map(
            (
              address
            ) => (
              <AddressCard
                key={
                  address.id
                }
                address={
                  address
                }
                busy={
                  busy
                }
                onEdit={() =>
                  openEdit(
                    address
                  )
                }
                onDelete={() =>
                  setDeletingAddress(
                    address
                  )
                }
                onSetDefaultShipping={() =>
                  void setShipping(
                    address
                  )
                }
                onSetDefaultBilling={() =>
                  void setBilling(
                    address
                  )
                }
              />
            )
          )}
        </div>
      )}

      <AddressModal
        open={
          modalOpen
        }
        address={
          editingAddress
        }
        submitting={
          busy
        }
        serverErrors={
          serverErrors
        }
        onClose={() => {
          if (
            !busy
          ) {
            setModalOpen(
              false
            );

            setEditingAddress(
              null
            );
          }
        }}
        onSubmit={
          save
        }
      />

      <AddressDeleteDialog
        open={
          Boolean(
            deletingAddress
          )
        }
        label={
          deletingAddress
            ?.label ||
          ""
        }
        deleting={
          busy
        }
        onCancel={() => {
          if (
            !busy
          ) {
            setDeletingAddress(
              null
            );
          }
        }}
        onConfirm={() =>
          void remove()
        }
      />
    </div>
  );
}
