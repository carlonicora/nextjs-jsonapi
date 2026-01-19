"use client";

import { useTranslations } from "next-intl";
import { Tab, TabsContainer } from "../../../../components";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { NotificationErrorBoundary } from "../common";
import { NotificationsList } from "../lists/NotificationsList";

function NotificationsListContainerContent() {
  const t = useTranslations();
  const { notifications: _notifications, isLoading: _isLoading, error } = useNotificationContext();

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div className="text-destructive text-sm">
          <p>Error loading notifications: {error}</p>
          <p className="text-muted-foreground mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const tabs: Tab[] = [
    {
      label: t(`notification.inbox`),
      content: <NotificationsList archived={false} />,
    },
    {
      label: t(`notification.archived`),
      content: <NotificationsList archived={true} />,
    },
  ];

  return <TabsContainer tabs={tabs} />;
}

export function NotificationsListContainer() {
  return (
    <NotificationErrorBoundary>
      <NotificationsListContainerContent />
    </NotificationErrorBoundary>
  );
}
