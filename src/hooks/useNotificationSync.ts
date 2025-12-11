"use client";

import { useEffect } from "react";
import { useNotificationContext, useSocketContext } from "../contexts";

export function useNotificationSync() {
  const { socketNotifications, clearSocketNotifications } = useSocketContext();
  const { addSocketNotifications } = useNotificationContext();

  useEffect(() => {
    if (socketNotifications.length > 0) {
      try {
        addSocketNotifications(socketNotifications);
        clearSocketNotifications();
      } catch (error) {
        console.error("💥 [useNotificationSync] Error processing notifications:", error);
      }
    }
  }, [socketNotifications, addSocketNotifications, clearSocketNotifications]);
}
