"use client";

import {
  createSlice,
} from "@reduxjs/toolkit";

import type {
  PayloadAction,
} from "@reduxjs/toolkit";

export interface CustomerAccount {
  id: string;
  companyId: string;

  firstName: string;

  lastName:
    | string
    | null;

  fullName: string;

  email: string;

  mobile:
    | string
    | null;

  status: string;

  emailVerifiedAt:
    | string
    | null;

  mobileVerifiedAt:
    | string
    | null;

  preferredLanguage: string;

  preferredCurrency: string;

  marketingConsent: boolean;

  lastLoginAt:
    | string
    | null;
}

export interface CustomerAuthState {
  customer:
    | CustomerAccount
    | null;

  accessToken:
    | string
    | null;

  hydrated: boolean;
  initializing: boolean;
  authenticated: boolean;

  error:
    | string
    | null;
}

const initialState:
  CustomerAuthState = {
    customer:
      null,

    accessToken:
      null,

    hydrated:
      false,

    initializing:
      false,

    authenticated:
      false,

    error:
      null,
  };

const customerAuthSlice =
  createSlice({
    name:
      "customerAuth",

    initialState,

    reducers: {
      hydrateCustomerAuth(
        state,
        action:
          PayloadAction<{
            customer:
              | CustomerAccount
              | null;

            accessToken:
              | string
              | null;
          }>
      ) {
        state.customer =
          action.payload
            .customer;

        state.accessToken =
          action.payload
            .accessToken;

        state.authenticated =
          Boolean(
            action.payload
              .customer &&
            action.payload
              .accessToken
          );

        state.hydrated =
          true;

        state.initializing =
          false;

        state.error =
          null;
      },

      setCustomerAuthInitializing(
        state,
        action:
          PayloadAction<boolean>
      ) {
        state.initializing =
          action.payload;
      },

      setCustomerAuth(
        state,
        action:
          PayloadAction<{
            customer:
              CustomerAccount;

            accessToken:
              string;
          }>
      ) {
        state.customer =
          action.payload
            .customer;

        state.accessToken =
          action.payload
            .accessToken;

        state.authenticated =
          true;

        state.hydrated =
          true;

        state.initializing =
          false;

        state.error =
          null;
      },

      updateCustomer(
        state,
        action:
          PayloadAction<
            Partial<CustomerAccount>
          >
      ) {
        if (
          !state.customer
        ) {
          return;
        }

        state.customer = {
          ...state.customer,
          ...action.payload,
        };
      },

      setCustomerAuthError(
        state,
        action:
          PayloadAction<
            string |
            null
          >
      ) {
        state.error =
          action.payload;
      },

      clearCustomerAuth(
        state
      ) {
        state.customer =
          null;

        state.accessToken =
          null;

        state.authenticated =
          false;

        state.initializing =
          false;

        state.hydrated =
          true;

        state.error =
          null;
      },
    },
  });

export const {
  hydrateCustomerAuth,
  setCustomerAuthInitializing,
  setCustomerAuth,
  updateCustomer,
  setCustomerAuthError,
  clearCustomerAuth,
} =
  customerAuthSlice.actions;

export default
  customerAuthSlice.reducer;

interface RootWithCustomerAuth {
  customerAuth:
    CustomerAuthState;
}

export const selectCustomerAuth =
  (
    state:
      RootWithCustomerAuth
  ) =>
    state.customerAuth;

export const selectCustomer =
  (
    state:
      RootWithCustomerAuth
  ) =>
    state.customerAuth
      .customer;

export const selectCustomerAccessToken =
  (
    state:
      RootWithCustomerAuth
  ) =>
    state.customerAuth
      .accessToken;

export const selectCustomerAuthenticated =
  (
    state:
      RootWithCustomerAuth
  ) =>
    state.customerAuth
      .authenticated;

export const selectCustomerAuthHydrated =
  (
    state:
      RootWithCustomerAuth
  ) =>
    state.customerAuth
      .hydrated;

export const selectCustomerAuthInitializing =
  (
    state:
      RootWithCustomerAuth
  ) =>
    state.customerAuth
      .initializing;

export const selectCustomerAuthError =
  (
    state:
      RootWithCustomerAuth
  ) =>
    state.customerAuth
      .error;
