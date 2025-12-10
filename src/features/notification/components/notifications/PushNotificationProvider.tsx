"use client";

import { ReactNode, type JSX } from "react";
import usePushNotifications from "../../../../hooks/usePushNotifications";

export function PushNotificationProvider({ children }: { children: ReactNode }): JSX.Element {
  usePushNotifications();
  return <>{children}</>;
}
