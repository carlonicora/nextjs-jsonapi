"use client";

import { createContext, ReactNode, useContext, type JSX } from "react";
import type { PushNotificationsState } from "../../../hooks/usePushNotifications";

const PushPromptContext = createContext<PushNotificationsState | null>(null);

/** Carries the push hook state from `PushNotificationProvider` to the bell. */
export function PushPromptProvider({
  value,
  children,
}: {
  value: PushNotificationsState;
  children: ReactNode;
}): JSX.Element {
  return <PushPromptContext.Provider value={value}>{children}</PushPromptContext.Provider>;
}

/** The push hook state, or `null` outside a `PushNotificationProvider`. */
export function usePushPrompt(): PushNotificationsState | null {
  return useContext(PushPromptContext);
}
