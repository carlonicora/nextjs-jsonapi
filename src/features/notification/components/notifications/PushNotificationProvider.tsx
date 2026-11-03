"use client";

import { ReactNode, type JSX } from "react";
import { useCurrentUserContext } from "../../../../contexts";
import usePushNotifications from "../../../../hooks/usePushNotifications";
import { getRoleId } from "../../../../roles";
import { UserInterface } from "../../../user/data";

/**
 * Registers the service worker and the push subscription for the current user.
 * Administrators never subscribe; `excludedRoleIds` adds app roles that never do
 * either (for example a read-only demo account, which must not install a worker).
 */
export function PushNotificationProvider({
  children,
  excludedRoleIds = [],
}: {
  children: ReactNode;
  excludedRoleIds?: string[];
}): JSX.Element {
  const { currentUser, hasRole } = useCurrentUserContext<UserInterface>();
  const canSubscribe = !hasRole(getRoleId().Administrator) && !excludedRoleIds.some((roleId) => hasRole(roleId));
  usePushNotifications({ currentUser: currentUser ?? undefined, canSubscribe });
  return <>{children}</>;
}
