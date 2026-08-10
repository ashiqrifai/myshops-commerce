"use client";

import type {
  CustomerAddress,
  CustomerAddressApiErrorShape,
  CustomerAddressFieldError,
  CustomerAddressInput,
} from "@/types/customerAddress";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env.NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{
      field?: string;
      message?: string;
      value?: unknown;
    }>;
  };
}

export class CustomerAddressApiError
  extends Error
  implements CustomerAddressApiErrorShape {
  status: number;
  code:
    | string
    | undefined;
  details:
    CustomerAddressFieldError[];

  constructor({
    status,
    code,
    message,
    details = [],
  }: {
    status: number;
    code?: string;
    message: string;
    details?: CustomerAddressFieldError[];
  }) {
    super(message);

    this.name =
      "CustomerAddressApiError";

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
    response: Response
  ) => {
    let payload:
      | ApiEnvelope<unknown>
      | undefined;

    try {
      payload =
        await response.json();
    } catch {
      payload =
        undefined;
    }

    const details =
      Array.isArray(
        payload?.error?.details
      )
        ? payload!.error!.details!
            .filter(
              (
                item
              ) =>
                Boolean(
                  item?.field &&
                  item?.message
                )
            )
            .map(
              (
                item
              ) => ({
                field:
                  String(
                    item.field
                  ),

                message:
                  String(
                    item.message
                  ),
              })
            )
        : [];

    throw new CustomerAddressApiError({
      status:
        response.status,

      code:
        payload?.error?.code,

      message:
        details[0]?.message ||
        payload?.error?.message ||
        payload?.message ||
        `Address request failed. HTTP ${response.status}`,

      details,
    });
  };

const request =
  async <T>({
    path,
    method = "GET",
    accessToken,
    body,
  }: {
    path: string;
    method?:
      | "GET"
      | "POST"
      | "PUT"
      | "PATCH"
      | "DELETE";
    accessToken: string;
    body?: unknown;
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
      await response.json()
    ) as
      ApiEnvelope<T>;
  };

const ensureData =
  <T>(
    payload:
      ApiEnvelope<T>,
    fallbackMessage:
      string
  ) => {
    if (
      !payload.success ||
      payload.data ===
        undefined
    ) {
      throw new CustomerAddressApiError({
        status:
          500,

        code:
          "INVALID_CUSTOMER_ADDRESS_RESPONSE",

        message:
          fallbackMessage,
      });
    }

    return payload.data;
  };

export const listCustomerAddresses =
  async (
    accessToken:
      string
  ) =>
    ensureData(
      await request<
        CustomerAddress[]
      >({
        path:
          "/public/customer-addresses",

        accessToken,
      }),

      "The address API returned an invalid response."
    );

export const createCustomerAddress =
  async ({
    accessToken,
    input,
  }: {
    accessToken: string;
    input:
      CustomerAddressInput;
  }) =>
    ensureData(
      await request<
        CustomerAddress
      >({
        path:
          "/public/customer-addresses",

        method:
          "POST",

        accessToken,

        body:
          input,
      }),

      "The address could not be created."
    );

export const updateCustomerAddress =
  async ({
    accessToken,
    addressId,
    input,
  }: {
    accessToken: string;
    addressId: string;
    input:
      CustomerAddressInput;
  }) =>
    ensureData(
      await request<
        CustomerAddress
      >({
        path:
          `/public/customer-addresses/${addressId}`,

        method:
          "PUT",

        accessToken,

        body:
          input,
      }),

      "The address could not be updated."
    );

export const deleteCustomerAddress =
  async ({
    accessToken,
    addressId,
  }: {
    accessToken: string;
    addressId: string;
  }) =>
    ensureData(
      await request<{
        id: string;
        deleted: boolean;
      }>({
        path:
          `/public/customer-addresses/${addressId}`,

        method:
          "DELETE",

        accessToken,
      }),

      "The address could not be removed."
    );

export const setDefaultShippingAddress =
  async ({
    accessToken,
    addressId,
  }: {
    accessToken: string;
    addressId: string;
  }) =>
    ensureData(
      await request<
        CustomerAddress
      >({
        path:
          `/public/customer-addresses/${addressId}/default-shipping`,

        method:
          "PATCH",

        accessToken,

        body:
          {},
      }),

      "The default shipping address could not be updated."
    );

export const setDefaultBillingAddress =
  async ({
    accessToken,
    addressId,
  }: {
    accessToken: string;
    addressId: string;
  }) =>
    ensureData(
      await request<
        CustomerAddress
      >({
        path:
          `/public/customer-addresses/${addressId}/default-billing`,

        method:
          "PATCH",

        accessToken,

        body:
          {},
      }),

      "The default billing address could not be updated."
    );
