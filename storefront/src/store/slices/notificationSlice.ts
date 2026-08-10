"use client";

import { createSlice, nanoid } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type NotificationTone = "success" | "warning" | "error" | "info" | "loading";

export interface AppNotification {
  id: string;
  tone: NotificationTone;
  title?: string;
  message: string;
  duration: number | null;
  createdAt: number;
  dismissible: boolean;
}

export interface NotificationState { items: AppNotification[]; }
const initialState: NotificationState = { items: [] };
const DEFAULT_DURATION = 4500;

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: {
      reducer(state, action: PayloadAction<AppNotification>) {
        state.items.push(action.payload);
      },
      prepare(payload: {
        tone: NotificationTone;
        title?: string;
        message: string;
        duration?: number | null;
        dismissible?: boolean;
        id?: string;
      }) {
        return {
          payload: {
            id: payload.id || nanoid(),
            tone: payload.tone,
            title: payload.title,
            message: payload.message,
            duration: payload.duration !== undefined ? payload.duration : payload.tone === "loading" ? null : DEFAULT_DURATION,
            createdAt: Date.now(),
            dismissible: payload.dismissible !== false,
          },
        };
      },
    },
    updateNotification(state, action: PayloadAction<{ id: string; patch: Partial<Omit<AppNotification,"id"|"createdAt">> }>) {
      const item = state.items.find((n) => n.id === action.payload.id);
      if (item) Object.assign(item, action.payload.patch);
    },
    dismissNotification(state, action: PayloadAction<string>) {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
    clearNotifications(state) { state.items = []; },
  },
});

export const { addNotification, updateNotification, dismissNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
interface RootWithNotifications { notifications: NotificationState; }
export const selectNotifications = (state: RootWithNotifications) => state.notifications.items;
