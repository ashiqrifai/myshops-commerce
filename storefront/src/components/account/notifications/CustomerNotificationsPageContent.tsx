"use client";

import {
  Bell,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  RefreshCcw,
  Trash2,
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
  CustomerNotificationApiError,
  deleteCustomerNotification,
  listCustomerNotifications,
  markAllCustomerNotificationsAsRead,
  markCustomerNotificationAsRead,
} from "@/lib/customer-notifications/customerNotificationApi";

import type {
  CustomerNotification,
  CustomerNotificationPagination,
} from "@/types/customerNotification";

import InlineToast from "@/components/ui/InlineToast";

type Filter =
  | "ALL"
  | "UNREAD";

const PAGE_SIZE =
  20;

const formatDateTime =
(
  value:
    string
) => {
  const date =
    new Date(
      value
    );

  return date.toLocaleString(
    undefined,
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );
};

export default function CustomerNotificationsPageContent() {
  const router =
    useRouter();

  const dispatch =
    useAppDispatch();

  const accessToken =
    useAppSelector(
      selectCustomerAccessToken
    );

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      CustomerNotification[]
    >(
      []
    );

  const [
    pagination,
    setPagination,
  ] =
    useState<
      CustomerNotificationPagination |
      null
    >(
      null
    );

  const [
    filter,
    setFilter,
  ] =
    useState<
      Filter
    >(
      "ALL"
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    busyId,
    setBusyId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    markingAll,
    setMarkingAll,
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
    toast,
    setToast,
  ] =
    useState<
      | {
          tone:
            | "success"
            | "error"
            | "info";

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
          "/account/login?returnUrl=%2Faccount%2Fnotifications"
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
            "Your session has expired. Please sign in again."
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
              CustomerNotificationApiError &&
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
                "Your session has expired. Please sign in again."
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
                listCustomerNotifications({
                  accessToken:
                    token,

                  page,

                  limit:
                    PAGE_SIZE,

                  unreadOnly:
                    filter ===
                    "UNREAD",
                })
            );

          setNotifications(
            result.notifications
          );

          setPagination(
            result.pagination
          );
        } catch (
          error
        ) {
          setLoadError(
            error instanceof
              Error
              ? error.message
              : "Notifications could not be loaded."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        filter,
        page,
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

  const changeFilter =
    (
      nextFilter:
        Filter
    ) => {
      setPage(
        1
      );

      setFilter(
        nextFilter
      );
    };

  const openNotification =
    async (
      notification:
        CustomerNotification
    ) => {
      if (
        busyId
      ) {
        return;
      }

      setBusyId(
        notification.id
      );

      try {
        if (
          !notification.isRead
        ) {
          await withValidToken(
            (
              token
            ) =>
              markCustomerNotificationAsRead({
                accessToken:
                  token,

                notificationId:
                  notification.id,
              })
          );
        }

        if (
          notification.actionUrl
        ) {
          router.push(
            notification.actionUrl
          );

          return;
        }

        if (
          !notification.isRead
        ) {
          await load();
        }
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
              : "The notification could not be opened.",
        });
      } finally {
        setBusyId(
          null
        );
      }
    };

  const remove =
    async (
      notification:
        CustomerNotification
    ) => {
      if (
        busyId
      ) {
        return;
      }

      setBusyId(
        notification.id
      );

      try {
        await withValidToken(
          (
            token
          ) =>
            deleteCustomerNotification({
              accessToken:
                token,

              notificationId:
                notification.id,
            })
        );

        setToast({
          tone:
            "success",

          message:
            "Notification removed.",
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
              : "The notification could not be removed.",
        });
      } finally {
        setBusyId(
          null
        );
      }
    };

  const markAllRead =
    async () => {
      if (
        markingAll
      ) {
        return;
      }

      setMarkingAll(
        true
      );

      try {
        await withValidToken(
          (
            token
          ) =>
            markAllCustomerNotificationsAsRead(
              token
            )
        );

        setToast({
          tone:
            "success",

          message:
            "All notifications marked as read.",
        });

        if (
          filter ===
          "UNREAD"
        ) {
          setPage(
            1
          );
        }

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
              : "Notifications could not be updated.",
        });
      } finally {
        setMarkingAll(
          false
        );
      }
    };

  const unreadOnPage =
    notifications.filter(
      (
        notification
      ) =>
        !notification.isRead
    ).length;

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
            Notifications
          </h1>

          <p className="mt-2 text-sm leading-6 text-storefront-muted">
            Keep track of your orders, payments, deliveries and account updates.
          </p>
        </div>

        {!loading &&
        notifications.length >
          0 &&
        (
          unreadOnPage >
            0 ||
          filter ===
            "UNREAD"
        ) ? (
          <button
            type="button"
            onClick={() =>
              void markAllRead()
            }
            disabled={
              markingAll
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-storefront-button border border-storefront-border bg-white px-5 text-sm font-black text-storefront-text transition hover:bg-storefront-secondary disabled:opacity-60"
          >
            <CheckCheck
              size={
                17
              }
            />

            {markingAll
              ? "Updating..."
              : "Mark all as read"}
          </button>
        ) : null}
      </div>

      <div className="mb-5 flex items-center gap-2 border-b border-storefront-border">
        <button
          type="button"
          onClick={() =>
            changeFilter(
              "ALL"
            )
          }
          className={[
            "border-b-2 px-4 py-3 text-sm font-black transition",

            filter ===
            "ALL"
              ? "border-storefront-primary text-storefront-primary"
              : "border-transparent text-storefront-muted hover:text-storefront-text",
          ].join(
            " "
          )}
        >
          All
        </button>

        <button
          type="button"
          onClick={() =>
            changeFilter(
              "UNREAD"
            )
          }
          className={[
            "border-b-2 px-4 py-3 text-sm font-black transition",

            filter ===
            "UNREAD"
              ? "border-storefront-primary text-storefront-primary"
              : "border-transparent text-storefront-muted hover:text-storefront-text",
          ].join(
            " "
          )}
        >
          Unread
        </button>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-[22px] border border-storefront-border bg-white">
          {Array.from({
            length:
              4,
          }).map(
            (
              _,
              index
            ) => (
              <div
                key={
                  index
                }
                className="flex animate-pulse gap-4 border-b border-storefront-border p-5 last:border-b-0"
              >
                <div className="size-11 shrink-0 rounded-full bg-storefront-secondary" />

                <div className="min-w-0 flex-1">
                  <div className="h-4 w-48 rounded bg-storefront-secondary" />

                  <div className="mt-3 h-3 w-full max-w-xl rounded bg-storefront-secondary" />

                  <div className="mt-2 h-3 w-24 rounded bg-storefront-secondary" />
                </div>
              </div>
            )
          )}
        </div>
      ) : loadError ? (
        <div className="rounded-[22px] border border-red-200 bg-red-50 px-6 py-10 text-center">
          <CircleAlert
            size={
              32
            }
            className="mx-auto text-red-600"
          />

          <p className="mt-3 text-sm font-bold text-red-700">
            {loadError}
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
      ) : notifications.length ===
        0 ? (
        <div className="rounded-[22px] border border-storefront-border bg-white px-6 py-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-storefront-secondary">
            <Bell
              size={
                25
              }
              className="text-storefront-primary"
            />
          </div>

          <h2 className="mt-4 text-lg font-black text-storefront-text">
            {filter ===
            "UNREAD"
              ? "You're all caught up"
              : "No notifications yet"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-storefront-muted">
            {filter ===
            "UNREAD"
              ? "You don't have any unread notifications."
              : "Updates about your orders, payments and deliveries will appear here."}
          </p>
        </div>
         ) : (
            <>
              <div className="overflow-hidden rounded-[22px] border border-storefront-border bg-white">
                {notifications.map(
                  (
                    notification
                  ) => (
                    <div
                      key={
                        notification.id
                      }
                      className={[
                        "group relative flex gap-3 border-b border-storefront-border p-4 transition-colors last:border-b-0 sm:gap-4 sm:p-5",
    
                        notification.isRead
                          ? "bg-white"
                          : "bg-storefront-secondary/40",
                      ].join(
                        " "
                      )}
                    >
                      <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
                        <Bell
                          size={
                            20
                          }
                        />
    
                        {!notification.isRead ? (
                          <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-storefront-primary" />
                        ) : null}
                      </div>
    
                      <button
                        type="button"
                        onClick={() =>
                          void openNotification(
                            notification
                          )
                        }
                        disabled={
                          busyId ===
                          notification.id
                        }
                        className="min-w-0 flex-1 text-left disabled:opacity-60"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <h2
                            className={[
                              "text-sm leading-5 text-storefront-text",
    
                              notification.isRead
                                ? "font-bold"
                                : "font-black",
                            ].join(
                              " "
                            )}
                          >
                            {
                              notification.title
                            }
                          </h2>
    
                          <span className="shrink-0 text-xs text-storefront-muted">
                            {formatDateTime(
                              notification.createdAt
                            )}
                          </span>
                        </div>
    
                        <p className="mt-1.5 text-sm leading-6 text-storefront-muted">
                          {
                            notification.message
                          }
                        </p>
    
                        {notification.actionUrl ? (
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-storefront-primary">
                            View details
    
                            <ChevronRight
                              size={
                                14
                              }
                            />
                          </span>
                        ) : null}
                      </button>
    
                      <button
                        type="button"
                        aria-label="Delete notification"
                        title="Delete notification"
                        disabled={
                          busyId ===
                          notification.id
                        }
                        onClick={() =>
                          void remove(
                            notification
                          )
                        }
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-storefront-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2
                          size={
                            17
                          }
                        />
                      </button>
                    </div>
                  )
                )}
              </div>
    
              {pagination &&
              pagination.totalPages >
                1 ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-storefront-muted">
                    Page{" "}
                    <span className="font-bold text-storefront-text">
                      {
                        pagination.page
                      }
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-storefront-text">
                      {
                        pagination.totalPages
                      }
                    </span>
                  </p>
    
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        !pagination.hasPreviousPage ||
                        loading
                      }
                      onClick={() =>
                        setPage(
                          (
                            current
                          ) =>
                            Math.max(
                              1,
                              current -
                                1
                            )
                        )
                      }
                      className="inline-flex h-10 items-center justify-center rounded-storefront-button border border-storefront-border bg-white px-4 text-sm font-black text-storefront-text transition hover:bg-storefront-secondary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
    
                    <button
                      type="button"
                      disabled={
                        !pagination.hasNextPage ||
                        loading
                      }
                      onClick={() =>
                        setPage(
                          (
                            current
                          ) =>
                            current +
                            1
                        )
                      }
                      className="inline-flex h-10 items-center justify-center rounded-storefront-button bg-storefront-primary px-4 text-sm font-black text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      );
    }