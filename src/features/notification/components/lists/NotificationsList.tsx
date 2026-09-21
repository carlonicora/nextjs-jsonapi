"use client";

import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useRef } from "react";
import { ContentListTable } from "../../../../components/tables/ContentListTable";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever, usePageUrlGenerator } from "../../../../hooks";
import { useI18nRouter } from "../../../../i18n";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { NotificationInterface } from "../../data";
import { NotificationFields } from "../../data/notification.fields";
import { NotificationService } from "../../data/notification.service";
import "../../hooks/useNotificationTableStructure";
import { generateNotificationData } from "../notifications/Notification";

type NotificationsListProps = {
  archived: boolean;
  headerControl?: ReactNode;
  fullWidth?: boolean;
};

export function NotificationsList({ archived, headerControl, fullWidth }: NotificationsListProps) {
  const t = useTranslations();
  const router = useI18nRouter();
  const generateUrl = usePageUrlGenerator();
  const { markNotificationsAsRead } = useNotificationContext();

  const data: DataListRetriever<NotificationInterface> = useDataListRetriever({
    module: Modules.Notification,
    retriever: (params) => NotificationService.findMany(params),
    retrieverParams: { isArchived: archived },
  });

  /* Mark read what this list ACTUALLY SHOWS, on every page. Reading the shared
     context's list instead would only ever cover the bell's first page, so
     anything reached by paging forward would stay unread permanently.

     `markedRef` guards the loop: `markNotificationsAsRead` refreshes the shared
     context, which re-renders this component, and `data.data` is not
     guaranteed to be reference-stable across renders. Tracking the ids already
     sent means a second pass finds nothing to do regardless of identity. */
  const markedRef = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    if (!data.isLoaded || !data.data) return;

    const unreadIds = data.data
      .filter((notification) => !notification.isRead && !markedRef.current.has(notification.id))
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    unreadIds.forEach((id) => markedRef.current.add(id));
    markNotificationsAsRead(unreadIds);
  }, [data.isLoaded, data.data, markNotificationsAsRead]);

  /* The whole row is the click target, matching the popover row — which is a
     `Link` wrapping its entire body. */
  const openNotification = (notification: NotificationInterface) => {
    const url = generateNotificationData({ notification: notification, generateUrl: generateUrl }).url;
    if (url) router.push(url);
  };

  return (
    <ContentListTable
      data={data}
      fields={[
        NotificationFields.icon,
        NotificationFields.description,
        NotificationFields.createdAt,
        NotificationFields.actions,
      ]}
      tableGeneratorType={Modules.Notification}
      title={t(`entities.notifications`, { count: 2 })}
      filters={headerControl}
      /* The notifications endpoint takes no search term, so rendering the box
         would give the page a control that silently does nothing. */
      allowSearch={false}
      context={{ archived: archived }}
      onRowClick={openNotification}
      emptyState={t(`notification.empty`)}
      fullWidth={fullWidth}
    />
  );
}
