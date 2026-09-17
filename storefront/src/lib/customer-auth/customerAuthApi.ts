"use client";

import type {
  CustomerAccount,
} from "@/store/slices/customerAuthSlice";

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

const DEVICE_STORAGE_KEY =
  "myshops:device-id:v1";

interface CustomerAuthEnvelope {
  success: boolean;

  data?: {
    customer:
      CustomerAccount;

    accessToken:
      string;
  };

  error?: {
    code?:
      string;

    message?:
      string;

    details?: Array<{
      field?: string;
      message?: string;
      value?: unknown;
    }>;
  };

  message?:
    string;
}

interface CustomerMeEnvelope {
  success: boolean;

  data?:
    CustomerAccount;

  error?: {
    code?: string;
    message?: string;
  };

  message?: string;
}

interface CustomerMessageEnvelope {
  success: boolean;

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

export class CustomerAuthApiError extends Error {
  status: number;

  code:
    | string
    | undefined;

  constructor({
    message,
    status,
    code,
  }: {
    message: string;
    status: number;
    code?: string;
  }) {
    super(message);

    this.name =
      "CustomerAuthApiError";

    this.status =
      status;

    this.code =
      code;
  }
}

const getDeviceId =
  () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return "server";
    }

    const existing =
      window.localStorage
        .getItem(
          DEVICE_STORAGE_KEY
        );

    if (existing) {
      return existing;
    }

    const generated =
      typeof crypto !==
        "undefined" &&
      "randomUUID" in
        crypto
        ? crypto.randomUUID()
        : `device-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    window.localStorage
      .setItem(
        DEVICE_STORAGE_KEY,
        generated
      );

    return generated;
  };

const parseError =
  async (
    response:
      Response
  ) => {
    let payload:
      | CustomerAuthEnvelope
      | CustomerMessageEnvelope
      | undefined;

    try {
      payload =
        await response.json();
    } catch {
      payload =
        undefined;
    }

    const validationDetails =
      payload
        ?.error
        ?.details;

    const firstValidationMessage =
      Array.isArray(
        validationDetails
      )
        ? validationDetails.find(
            (
              detail
            ): detail is {
              field?: string;
              message?: string;
            } =>
              Boolean(
                detail &&
                typeof detail ===
                  "object"
              )
          )?.message
        : undefined;

    throw new CustomerAuthApiError({
      status:
        response.status,

      code:
        payload
          ?.error
          ?.code,

      message:
        firstValidationMessage ||
        payload
          ?.error
          ?.message ||
        payload
          ?.message ||
        `Customer authentication request failed. HTTP ${response.status}`,
    });
  };

const request =
  async <T>({
    path,
    method =
      "GET",
    body,
    accessToken,
  }: {
    path: string;

    method?:
      | "GET"
      | "POST"
      | "PATCH"
      | "PUT"
      | "DELETE";

    body?: unknown;

    accessToken?:
      | string
      | null;
  }): Promise<T> => {
    const headers:
      Record<
        string,
        string
      > = {
        Accept:
          "application/json",

        "Content-Type":
          "application/json",

        "x-company-code":
          COMPANY_CODE,

        "x-device-id":
          getDeviceId(),
      };

    if (
      accessToken
    ) {
      headers.Authorization =
        `Bearer ${accessToken}`;
    }

    const response =
      await fetch(
        `${API_URL}${path}`,
        {
          method,
          headers,

          credentials:
            "include",

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
    ) as T;
  };

export const registerCustomer =
  async (
    input: {
      firstName: string;
      lastName?: string;
      email: string;
      mobile?: string;
      password: string;
      preferredLanguage?:
        | "en"
        | "ar";
      marketingConsent?:
        boolean;
    }
  ) => {
    const payload =
      await request<
        CustomerAuthEnvelope
      >({
        path:
          "/public/customer-auth/register",

        method:
          "POST",

        body:
          input,
      });

    if (
      !payload.success ||
      !payload.data
    ) {
      throw new CustomerAuthApiError({
        status: 500,
        code:
          "INVALID_CUSTOMER_REGISTER_RESPONSE",
        message:
          "The registration API returned an invalid response.",
      });
    }

    return payload.data;
  };

export const loginCustomer =
  async (
    input: {
      email: string;
      password: string;
    }
  ) => {
    const payload =
      await request<
        CustomerAuthEnvelope
      >({
        path:
          "/public/customer-auth/login",

        method:
          "POST",

        body:
          input,
      });

    if (
      !payload.success ||
      !payload.data
    ) {
      throw new CustomerAuthApiError({
        status: 500,
        code:
          "INVALID_CUSTOMER_LOGIN_RESPONSE",
        message:
          "The login API returned an invalid response.",
      });
    }

    return payload.data;
  };

export const forgotCustomerPassword =
  async (
    input: {
      email: string;
    }
  ) => {
    const payload =
      await request<
        CustomerMessageEnvelope
      >({
        path:
          "/public/customer-auth/forgot-password",

        method:
          "POST",

        body:
          input,
      });

    if (
      !payload.success
    ) {
      throw new CustomerAuthApiError({
        status: 500,
        code:
          "INVALID_FORGOT_PASSWORD_RESPONSE",
        message:
          "The password reset API returned an invalid response.",
      });
    }

    return {
      message:
        payload.message ||
        "If an account exists for that email address, a password reset link has been sent.",
    };
  };

export const resetCustomerPassword =
  async (
    input: {
      token: string;
      password: string;
      confirmPassword: string;
    }
  ) => {
    const payload =
      await request<
        CustomerMessageEnvelope
      >({
        path:
          "/public/customer-auth/reset-password",

        method:
          "POST",

        body:
          input,
      });

    if (
      !payload.success
    ) {
      throw new CustomerAuthApiError({
        status: 500,
        code:
          "INVALID_RESET_PASSWORD_RESPONSE",
        message:
          "The password reset API returned an invalid response.",
      });
    }

    return {
      message:
        payload.message ||
        "Your password has been reset successfully.",
    };
  };

export const refreshCustomer =
  async () => {
    const payload =
      await request<
        CustomerAuthEnvelope
      >({
        path:
          "/public/customer-auth/refresh",

        method:
          "POST",

        body:
          {},
      });

    if (
      !payload.success ||
      !payload.data
    ) {
      throw new CustomerAuthApiError({
        status: 500,
        code:
          "INVALID_CUSTOMER_REFRESH_RESPONSE",
        message:
          "The refresh API returned an invalid response.",
      });
    }

    return payload.data;
  };

export const getCurrentCustomer =
  async (
    accessToken:
      string
  ) => {
    const payload =
      await request<
        CustomerMeEnvelope
      >({
        path:
          "/public/customer-auth/me",

        accessToken,
      });

    if (
      !payload.success ||
      !payload.data
    ) {
      throw new CustomerAuthApiError({
        status: 500,
        code:
          "INVALID_CUSTOMER_ME_RESPONSE",
        message:
          "The customer profile API returned an invalid response.",
      });
    }

    return payload.data;
  };

export const logoutCustomer =
  async () => {
    await request<{
      success: boolean;
    }>({
      path:
        "/public/customer-auth/logout",

      method:
        "POST",

      body:
        {},
    });
  };

export const logoutCustomerFromAllDevices =
  async (
    accessToken:
      string
  ) => {
    await request<{
      success: boolean;
    }>({
      path:
        "/public/customer-auth/logout-all",

      method:
        "POST",

      body:
        {},

      accessToken,
    });
  };
