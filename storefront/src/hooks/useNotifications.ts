"use client";

import { useCallback } from "react";
import { nanoid } from "@reduxjs/toolkit";
import { useAppDispatch } from "@/store/hooks";
import { addNotification, updateNotification, dismissNotification } from "@/store/slices/notificationSlice";
import type { NotificationTone } from "@/store/slices/notificationSlice";

type NotifyOptions = { title?: string; duration?: number | null; dismissible?: boolean; };

export function useNotifications() {
  const dispatch = useAppDispatch();
  const notify = useCallback((tone: NotificationTone, message: string, options: NotifyOptions = {}) => {
    const id = nanoid();
    dispatch(addNotification({ id, tone, message, title: options.title, duration: options.duration, dismissible: options.dismissible }));
    return id;
  }, [dispatch]);

  return {
    success: (message: string, options?: NotifyOptions) => notify("success", message, options),
    warning: (message: string, options?: NotifyOptions) => notify("warning", message, options),
    error: (message: string, options?: NotifyOptions) => notify("error", message, { duration: 6500, ...options }),
    info: (message: string, options?: NotifyOptions) => notify("info", message, options),
    loading: (message: string, options?: Omit<NotifyOptions,"duration">) => notify("loading", message, { ...options, duration: null }),
    update: (id: string, patch: { tone?: NotificationTone; title?: string; message?: string; duration?: number | null; dismissible?: boolean; }) => dispatch(updateNotification({ id, patch })),
    complete: (id: string, args: { tone?: Exclude<NotificationTone,"loading">; title?: string; message: string; duration?: number | null; }) => dispatch(updateNotification({ id, patch: { tone: args.tone || "success", title: args.title, message: args.message, duration: args.duration === undefined ? 4500 : args.duration, dismissible: true } })),
    dismiss: (id: string) => dispatch(dismissNotification(id)),
  };
}
