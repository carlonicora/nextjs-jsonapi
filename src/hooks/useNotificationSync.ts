"use client";

import { useEffect } from "react";
import { useNotificationContext, useSocketContext } from "../contexts";

export function useNotificationSync() {
  const { socketNotifications, clearSocketNotifications, readNotificationIds, clearReadNotificationIds } =
    useSocketContext();
  const { addSocketNotifications, applyReadNotifications } = useNotificationContext();

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

  useEffect(() => {
    if (readNotificationIds.length === 0) return;
    applyReadNotifications(readNotificationIds);
    clearReadNotificationIds();
  }, [readNotificationIds, applyReadNotifications, clearReadNotificationIds]);
}
