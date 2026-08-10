"use client";

import {
  Bell,
  CheckCheck,
  Loader2,
} from "lucide-react";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useRef,
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
  selectCustomerAuthenticated,
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
  getCustomerNotificationUnreadCount,
  listCustomerNotifications,
  markAllCustomerNotificationsAsRead,
  markCustomerNotificationAsRead,
} from "@/lib/customer-notifications/customerNotificationApi";

import type {
  CustomerNotification,
} from "@/types/customerNotification";

const formatRelativeTime =
(
  value:
    string
) => {
  const date =
    new Date(
      value
    );

  const diff =
    Date.now() -
    date.getTime();

  const minutes =
    Math.floor(
      diff /
      60000
    );

  if (
    minutes <
    1
  ) {
    return "Just now";
  }

  if (
    minutes <
    60
  ) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes /
      60
    );

  if (
    hours <
    24
  ) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours /
      24
    );

  if (
    days <
    7
  ) {
    return `${days}d ago`;
  }

  return date
    .toLocaleDateString();
};

export default function CustomerNotificationBell() {
  const router =
    useRouter();

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

  const containerRef =
    useRef<
      HTMLDivElement |
      null
    >(
      null
    );

  const [
    open,
    setOpen,
  ] =
    useState(
      false
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
    unreadCount,
    setUnreadCount,
  ] =
    useState(
      0
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    markingAll,
    setMarkingAll,
  ] =
    useState(
      false
    );

  const [
    loadedOnce,
    setLoadedOnce,
  ] =
    useState(
      false
    );

  const expireSession =
    useCallback(
      () => {
        dispatch(
          clearCustomerAuth()
        );

        clearCustomerAuthStorage();

        setUnreadCount(
          0
        );

        setNotifications(
          []
        );

        setLoadedOnce(
          false
        );

        setOpen(
          false
        );
      },
      [
        dispatch,
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
            "Customer session is not available."
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
            } catch (
              refreshError
            ) {
              expireSession();

              throw refreshError;
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

  const loadUnreadCount =
    useCallback(
      async () => {
        if (
          !authenticated ||
          !accessToken
        ) {
          setUnreadCount(
            0
          );

          return;
        }

        try {
          const result =
            await withValidToken(
              (
                token
              ) =>
                getCustomerNotificationUnreadCount(
                  token
                )
            );

          setUnreadCount(
            result.unreadCount
          );
        } catch (
          error
        ) {
          console.error(
            "Unable to load notification unread count:",
            error
          );
        }
      },
      [
        authenticated,
        accessToken,
        withValidToken,
      ]
    );

  const loadNotifications =
    useCallback(
      async () => {
        if (
          !authenticated ||
          !accessToken
        ) {
          return;
        }

        setLoading(
          true
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

                  page:
                    1,

                  limit:
                    6,
                })
            );

          setNotifications(
            result.notifications
          );

          setLoadedOnce(
            true
          );
        } catch (
          error
        ) {
          console.error(
            "Unable to load customer notifications:",
            error
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        authenticated,
        accessToken,
        withValidToken,
      ]
    );

  useEffect(
    () => {
      if (
        !authenticated ||
        !accessToken
      ) {
        setUnreadCount(
          0
        );

        setNotifications(
          []
        );

        setLoadedOnce(
          false
        );

        setOpen(
          false
        );

        return;
      }

      void loadUnreadCount();
    },
    [
      authenticated,
      accessToken,
      loadUnreadCount,
    ]
  );

  useEffect(
    () => {
      const handleClickOutside =
        (
          event:
            MouseEvent
        ) => {
          if (
            !containerRef.current
          ) {
            return;
          }

          if (
            !containerRef.current.contains(
              event.target as Node
            )
          ) {
            setOpen(
              false
            );
          }
        };

      document.addEventListener(
        "mousedown",
        handleClickOutside
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handleClickOutside
        );
      };
    },
    []
  );

  const handleToggle =
    async () => {
      const nextOpen =
        !open;

      setOpen(
        nextOpen
      );

      if (
        nextOpen &&
        !loadedOnce
      ) {
        await loadNotifications();
      }
    };

  const handleNotificationClick =
    async (
      notification:
        CustomerNotification
    ) => {
      if (
        !accessToken
      ) {
        return;
      }

      try {
        if (
          !notification.isRead
        ) {
          const updated =
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

          setNotifications(
            (
              current
            ) =>
              current.map(
                (
                  item
                ) =>
                  item.id ===
                  notification.id
                    ? updated
                    : item
              )
          );

          setUnreadCount(
            (
              current
            ) =>
              Math.max(
                0,
                current -
                  1
              )
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Unable to mark notification as read:",
          error
        );
      }

      setOpen(
        false
      );

      if (
        notification.actionUrl
      ) {
        router.push(
          notification.actionUrl
        );
      }
    };

  const handleMarkAll =
    async () => {
      if (
        !accessToken ||
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

        const readAt =
          new Date()
            .toISOString();

        setNotifications(
          (
            current
          ) =>
            current.map(
              (
                notification
              ) => ({
                ...notification,

                isRead:
                  true,

                readAt:
                  notification.readAt ||
                  readAt,
              })
            )
        );

        setUnreadCount(
          0
        );
      } catch (
        error
      ) {
        console.error(
          "Unable to mark all notifications as read:",
          error
        );
      } finally {
        setMarkingAll(
          false
        );
      }
    };

  if (
    !authenticated
  ) {
    return null;
  }

  return (
    <div
      ref={
        containerRef
      }
      className="relative"
    >
      <button
        type="button"
        onClick={
          handleToggle
        }
        aria-label="Notifications"
        aria-expanded={
          open
        }
        className="relative flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-storefront-text transition-colors hover:bg-storefront-secondary hover:text-storefront-primary"
      >
        <span className="relative">
          <Bell
            size={
              21
            }
          />

          {unreadCount >
          0 ? (
            <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-storefront-primary px-1 text-[9px] font-bold leading-none text-white">
              {unreadCount >
              99
                ? "99+"
                : unreadCount}
            </span>
          ) : null}
        </span>

        <span className="hidden whitespace-nowrap text-xs font-semibold xl:inline">
          Notifications
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[80] mt-2 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-storefront-border bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-storefront-border px-4 py-3">
            <div>
              <p className="text-sm font-bold text-storefront-text">
                Notifications
              </p>

              <p className="mt-0.5 text-xs text-storefront-muted">
                {unreadCount >
                0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            {unreadCount >
            0 ? (
              <button
                type="button"
                onClick={
                  handleMarkAll
                }
                disabled={
                  markingAll
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-storefront-primary hover:underline disabled:opacity-60"
              >
                {markingAll ? (
                  <Loader2
                    size={
                      14
                    }
                    className="animate-spin"
                  />
                ) : (
                  <CheckCheck
                    size={
                      14
                    }
                  />
                )}

                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex min-h-36 items-center justify-center">
                <Loader2
                  size={
                    22
                  }
                  className="animate-spin text-storefront-primary"
                />
              </div>
            ) : notifications.length ===
              0 ? (
              <div className="px-6 py-10 text-center">
                <Bell
                  size={
                    30
                  }
                  className="mx-auto text-storefront-muted"
                />

                <p className="mt-3 text-sm font-semibold text-storefront-text">
                  No notifications yet
                </p>

                <p className="mt-1 text-xs leading-5 text-storefront-muted">
                  Updates about your orders, payments and deliveries will appear here.
                </p>
              </div>
            ) : (
              notifications.map(
                (
                  notification
                ) => (
                  <button
                    key={
                      notification.id
                    }
                    type="button"
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                    className={[
                      "relative block w-full border-b border-storefront-border px-4 py-3 text-left transition-colors hover:bg-storefront-secondary/70",

                      notification.isRead
                        ? "bg-white"
                        : "bg-storefront-secondary/40",
                    ].join(
                      " "
                    )}
                  >
                    {!notification.isRead ? (
                      <span className="absolute left-2 top-5 size-2 rounded-full bg-storefront-primary" />
                    ) : null}

                    <div className="pl-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-5 text-storefront-text">
                          {
                            notification.title
                          }
                        </p>

                        <span className="shrink-0 text-[10px] text-storefront-muted">
                          {formatRelativeTime(
                            notification.createdAt
                          )}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-storefront-muted">
                        {
                          notification.message
                        }
                      </p>
                    </div>
                  </button>
                )
              )
            )}
          </div>

          <div className="border-t border-storefront-border bg-white p-3">
            <Link
              href="/account/notifications"
              onClick={() =>
                setOpen(
                  false
                )
              }
              className="flex min-h-10 items-center justify-center rounded-lg text-sm font-semibold text-storefront-primary transition-colors hover:bg-storefront-secondary"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}