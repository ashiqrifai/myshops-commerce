"use client";

import { useAppSelector } from "@/store/hooks";
import { selectNotifications } from "@/store/slices/notificationSlice";
import NotificationToast from "./NotificationToast";

export default function NotificationViewport() {
  const notifications = useAppSelector(selectNotifications);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-3 px-4 sm:left-auto sm:right-4 sm:w-[420px] sm:items-stretch sm:px-0" aria-live="polite" aria-relevant="additions removals">
      {notifications.map((notification) => <NotificationToast key={notification.id} notification={notification} />)}
    </div>
  );
}
