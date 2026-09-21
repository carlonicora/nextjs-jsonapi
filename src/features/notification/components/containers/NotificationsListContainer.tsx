"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { RoundPageContainer } from "../../../../components/containers/RoundPageContainer";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { NotificationErrorBoundary } from "../common";
import { NotificationViewMode, NotificationViewSwitcher } from "../filters/NotificationViewSwitcher";
import { NotificationsList } from "../lists/NotificationsList";
import { Modules } from "../../../../core";

function NotificationsListContainerContent() {
  const searchParams = useSearchParams();
  const { error } = useNotificationContext();

  const tabParam = searchParams.get("tab");
  const [mode, setMode] = useState<NotificationViewMode>(tabParam === "archived" ? "archived" : "inbox");

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div className="text-destructive text-xs/relaxed">
          <p>Error loading notifications: {error}</p>
          <p className="text-muted-foreground mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  /* `replaceState` rather than a router push: the tab is a view preference, so
     it belongs in the URL for reload/share but must not add a history entry
     per toggle. */
  const handleModeChange = (next: NotificationViewMode) => {
    setMode(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.toString());
  };

  return (
    <NotificationsList
      key={mode}
      archived={mode === "archived"}
      fullWidth
      headerControl={<NotificationViewSwitcher value={mode} onChange={handleModeChange} />}
    />
  );
}

export function NotificationsListContainer() {
  return (
    /* `fullWidth` without `forceHeader`: the page header is ContentListTable's
       own title row, which is where the Inbox/Archived switcher lives. Adding
       `forceHeader` would stack a second bar with the same title above it. */
    <RoundPageContainer module={Modules.Notification} fullWidth>
      <NotificationErrorBoundary>
        <NotificationsListContainerContent />
      </NotificationErrorBoundary>
    </RoundPageContainer>
  );
}
