"use client";

import { CheckCircle2, CircleAlert, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { dismissNotification } from "@/store/slices/notificationSlice";
import type { AppNotification } from "@/store/slices/notificationSlice";

const toneClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  error: "border-red-200 bg-red-50 text-red-950",
  info: "border-blue-200 bg-blue-50 text-blue-950",
  loading: "border-storefront bg-white text-storefront-text",
} as const;

export default function NotificationToast({ notification }: { notification: AppNotification }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (notification.duration === null || notification.duration <= 0) return;
    const timer = window.setTimeout(() => dispatch(dismissNotification(notification.id)), notification.duration);
    return () => window.clearTimeout(timer);
  }, [dispatch, notification.duration, notification.id, notification.message, notification.tone]);

  const Icon = notification.tone === "success" ? CheckCircle2 : notification.tone === "warning" ? TriangleAlert : notification.tone === "error" ? CircleAlert : notification.tone === "loading" ? LoaderCircle : Info;
  return (
    <div className={`pointer-events-auto w-full rounded-2xl border p-4 shadow-xl backdrop-blur-sm animate-[notification-in_180ms_ease-out] ${toneClasses[notification.tone]}`} role={notification.tone === "error" ? "alert" : "status"}>
      <div className="flex items-start gap-3">
        <Icon size={21} className={`mt-0.5 shrink-0 ${notification.tone === "loading" ? "animate-spin" : ""}`} />
        <div className="min-w-0 flex-1">
          {notification.title ? <p className="text-sm font-black">{notification.title}</p> : null}
          <p className={`text-sm leading-6 ${notification.title ? "mt-0.5 font-medium" : "font-bold"}`}>{notification.message}</p>
        </div>
        {notification.dismissible ? <button type="button" onClick={() => dispatch(dismissNotification(notification.id))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-black/5" aria-label="Dismiss notification"><X size={16}/></button> : null}
      </div>
    </div>
  );
}
