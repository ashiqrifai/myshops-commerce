"use client";

import type {
  CustomerNotification,
  CustomerNotificationApiErrorShape,
  CustomerNotificationDeleteResult,
  CustomerNotificationFieldError,
  CustomerNotificationListResult,
  CustomerNotificationMarkAllResult,
  CustomerNotificationPagination,
  CustomerNotificationUnreadCount,
} from "@/types/customerNotification";

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

interface ApiEnvelope<T> {
  success:
    boolean;

  data?:
    T;

  message?:
    string;

  meta?:
    CustomerNotificationPagination;

  error?: {
    code?:
      string;

    message?:
      string;

    details?: Array<{
      field?:
        string;

      message?:
        string;

      value?:
        unknown;
    }>;
  };
}

export class CustomerNotificationApiError
  extends Error
  implements CustomerNotificationApiErrorShape
{
  status:
    number;

  code:
    | string
    | undefined;

  details:
    CustomerNotificationFieldError[];

  constructor({
    status,
    code,
    message,
    details = [],
  }: {
    status:
      number;

    code?:
      string;

    message:
      string;

    details?:
      CustomerNotificationFieldError[];
  }) {
    super(
      message
    );

    this.name =
      "CustomerNotificationApiError";

    this.status =
      status;

    this.code =
      code;

    this.details =
      details;
  }
}

const parseError =
  async (
    response:
      Response
  ) => {
    let payload:
      | ApiEnvelope<unknown>
      | undefined;

    try {
      payload =
        await response
          .json();
    } catch {
      payload =
        undefined;
    }

    const details =
      Array.isArray(
        payload?.error
          ?.details
      )
        ? payload!
            .error!
            .details!
            .filter(
              (
                item
              ) =>
                Boolean(
                  item
                    ?.message
                )
            )
            .map(
              (
                item
              ) => ({
                field:
                  item.field
                    ? String(
                        item.field
                      )
                    : undefined,

                message:
                  item.message
                    ? String(
                        item.message
                      )
                    : undefined,
              })
            )
        : [];

    throw new CustomerNotificationApiError({
      status:
        response.status,

      code:
        payload?.error
          ?.code,

      message:
        details[0]
          ?.message ||
        payload?.error
          ?.message ||
        payload?.message ||
        `Notification request failed. HTTP ${response.status}`,

      details,
    });
  };

const request =
  async <T>({
    path,

    method =
      "GET",

    accessToken,

    body,
  }: {
    path:
      string;

    method?:
      | "GET"
      | "POST"
      | "PUT"
      | "PATCH"
      | "DELETE";

    accessToken:
      string;

    body?:
      unknown;
  }): Promise<
    ApiEnvelope<T>
  > => {
    const response =
      await fetch(
        `${API_URL}${path}`,
        {
          method,

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,

            "x-company-code":
              COMPANY_CODE,
          },

          body:
            body ===
            undefined
              ? undefined
              : JSON.stringify(
                  body
                ),
        }
      );

    if (
      !response.ok
    ) {
      await parseError(
        response
      );
    }

    return (
      await response
        .json()
    ) as ApiEnvelope<T>;
  };

const ensureData =
  <T>(
    payload:
      ApiEnvelope<T>,

    fallbackMessage:
      string
  ): T => {
    if (
      !payload.success ||
      payload.data ===
        undefined
    ) {
      throw new CustomerNotificationApiError({
        status:
          500,

        code:
          "INVALID_CUSTOMER_NOTIFICATION_RESPONSE",

        message:
          fallbackMessage,
      });
    }

    return payload.data;
  };

/*
|--------------------------------------------------------------------------
| List notifications
|--------------------------------------------------------------------------
*/

export const listCustomerNotifications =
  async ({
    accessToken,

    page =
      1,

    limit =
      20,

    unreadOnly =
      false,

    type,
  }: {
    accessToken:
      string;

    page?:
      number;

    limit?:
      number;

    unreadOnly?:
      boolean;

    type?:
      string;
  }): Promise<
    CustomerNotificationListResult
  > => {
    const params =
      new URLSearchParams();

    params.set(
      "page",
      String(
        page
      )
    );

    params.set(
      "limit",
      String(
        limit
      )
    );

    if (
      unreadOnly
    ) {
      params.set(
        "unreadOnly",
        "true"
      );
    }

    if (
      type
    ) {
      params.set(
        "type",
        type
      );
    }

    const payload =
      await request<
        CustomerNotification[]
      >({
        path:
          `/public/customer-notifications?${params.toString()}`,

        accessToken,
      });

    const notifications =
      ensureData(
        payload,
        "The notification API returned an invalid response."
      );

    return {
      notifications,

      pagination:
        payload.meta || {
          page,

          limit,

          total:
            notifications.length,

          totalPages:
            notifications.length >
            0
              ? 1
              : 0,

          hasNextPage:
            false,

          hasPreviousPage:
            false,
        },
    };
  };

/*
|--------------------------------------------------------------------------
| Unread count
|--------------------------------------------------------------------------
*/

export const getCustomerNotificationUnreadCount =
  async (
    accessToken:
      string
  ) =>
    ensureData(
      await request<
        CustomerNotificationUnreadCount
      >({
        path:
          "/public/customer-notifications/unread-count",

        accessToken,
      }),

      "The unread notification count could not be loaded."
    );

/*
|--------------------------------------------------------------------------
| Mark notification as read
|--------------------------------------------------------------------------
*/

export const markCustomerNotificationAsRead =
  async ({
    accessToken,

    notificationId,
  }: {
    accessToken:
      string;

    notificationId:
      string;
  }) =>
    ensureData(
      await request<
        CustomerNotification
      >({
        path:
          `/public/customer-notifications/${notificationId}/read`,

        method:
          "PATCH",

        accessToken,

        body:
          {},
      }),

      "The notification could not be marked as read."
    );

/*
|--------------------------------------------------------------------------
| Mark all notifications as read
|--------------------------------------------------------------------------
*/

export const markAllCustomerNotificationsAsRead =
  async (
    accessToken:
      string
  ) =>
    ensureData(
      await request<
        CustomerNotificationMarkAllResult
      >({
        path:
          "/public/customer-notifications/read-all",

        method:
          "PATCH",

        accessToken,

        body:
          {},
      }),

      "The notifications could not be marked as read."
    );

/*
|--------------------------------------------------------------------------
| Delete notification
|--------------------------------------------------------------------------
*/

export const deleteCustomerNotification =
  async ({
    accessToken,

    notificationId,
  }: {
    accessToken:
      string;

    notificationId:
      string;
  }) =>
    ensureData(
      await request<
        CustomerNotificationDeleteResult
      >({
        path:
          `/public/customer-notifications/${notificationId}`,

        method:
          "DELETE",

        accessToken,
      }),

      "The notification could not be removed."
    );