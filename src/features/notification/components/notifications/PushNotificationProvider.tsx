"use client";

import { ReactNode, type JSX } from "react";
import { useCurrentUserContext } from "../../../../contexts";
import usePushNotifications from "../../../../hooks/usePushNotifications";
import { getRoleId } from "../../../../roles";
import { UserInterface } from "../../../user/data";

export function PushNotificationProvider({ children }: { children: ReactNode }): JSX.Element {
  const { currentUser, hasRole } = useCurrentUserContext<UserInterface>();
  usePushNotifications({ currentUser: currentUser ?? undefined, canSubscribe: !hasRole(getRoleId().Administrator) });
  return <>{children}</>;
}
