"use client";

import { ReactNode, type JSX } from "react";
import { useCurrentUserContext } from "../../../../contexts";
import usePushNotifications from "../../../../hooks/usePushNotifications";
import { getRoleId } from "../../../../roles";
import { UserInterface } from "../../../user/data";
import { PushPromptProvider } from "../../contexts/PushPromptContext";

/**
 * Registers the service worker and the push subscription for the current user.
 * Administrators never subscribe; `excludedRoleIds` adds app roles that never do
 * either (for example a read-only demo account, which must not install a worker).
 * The hook state reaches the bell through `usePushPrompt()`.
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
  const state = usePushNotifications({ currentUser: currentUser ?? undefined, canSubscribe });
  return <PushPromptProvider value={state}>{children}</PushPromptProvider>;
}
