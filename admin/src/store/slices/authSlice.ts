import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        accessToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.initialized = true;
    },

    setInitialized: (state) => {
      state.initialized = true;
    },

    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.initialized = true;
    },
  },
});

export const {
  setCredentials,
  setInitialized,
  clearCredentials,
} = authSlice.actions;

export default authSlice.reducer;