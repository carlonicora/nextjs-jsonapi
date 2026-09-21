"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArchiveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { registerTableGenerator, TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../hooks";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "../../../shadcnui";
import { formatDate } from "../../../utils";
import { generateNotificationData } from "../components/notifications/Notification";
import { useNotificationContext } from "../contexts/NotificationContext";
import { NotificationIcon } from "../components/notifications/NotificationIcon";
import { NotificationInterface } from "../data";
import { NotificationFields } from "../data/notification.fields";
import { NotificationService } from "../data/notification.service";

const NOTIFICATIONS_MODULE_NAME = "notifications";

/**
 * Columns for the /notifications list.
 *
 * The row shape deliberately mirrors the notification popover row
 * (`Notification.tsx` → `NotificationMenuItem`): the same `NotificationIcon` in
 * a fixed first column, the same `t.rich(...)` sentence with `font-medium`
 * emphasis, the same timestamp. Someone moving from the bell to the full page
 * should recognise the same rows, not a different rendering of them.
 *
 * `context.archived` comes from `ContentListTable`'s `context` prop — the
 * archive control is hidden in the archived tab, where it has nothing to do.
 */
export const useNotificationTableStructure: UseTableStructureHook<NotificationInterface, NotificationFields> = (
  params,
) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { loadNotifications } = useNotificationContext();

  const archived: boolean = params.context?.archived === true;

  /* The shared context is refetched, not just this list's retriever: the bell
     renders from that context, and the API already hides archived rows from
     it. Dropping the row only here left the popover showing a notification the
     page had just archived until the context's 5-minute cache expired. */
  const archiveNotification = async (notification: NotificationInterface) => {
    await NotificationService.archive({ id: notification.id });
    params.dataRetriever?.removeElement(notification);
    await loadNotifications();
  };

  const tableData = useMemo(() => {
    return params.data.map((notification: NotificationInterface) => {
      const entry: TableContent<NotificationInterface> = { jsonApiData: notification };
      entry[NotificationFields.notificationId] = notification.id;
      entry[NotificationFields.createdAt] = notification.createdAt;
      return entry;
    });
  }, [params.data]);

  const fieldColumnMap: Partial<Record<NotificationFields, () => any>> = {
    [NotificationFields.icon]: () => ({
      id: "icon",
      accessorKey: "icon",
      header: ``,
      meta: { className: "w-20" },
      cell: ({ row }: { row: TableContent<NotificationInterface> }) => {
        const notification: NotificationInterface = row.original.jsonApiData;

        /* `isRead` here is the value the row was FETCHED with, and it stays
           that way: opening the page marks what it shows as read, so a dot
           that reacted to that would blink out under the reader's eyes. It
           means "was unread when you opened the page", and it leads the row so
           the eye picks up what is new before reading anything else. */
        return (
          <div className="flex items-center gap-2">
            {notification.isRead ? (
              <span className="size-2 shrink-0" aria-hidden />
            ) : (
              <Tooltip>
                <TooltipTrigger render={<span className="bg-primary size-2 shrink-0 rounded-full" />}>
                  <span className="sr-only">{t(`notification.unread`)}</span>
                </TooltipTrigger>
                <TooltipContent>{t(`notification.unread`)}</TooltipContent>
              </Tooltip>
            )}
            <NotificationIcon notificationType={notification.notificationType} />
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [NotificationFields.description]: () => ({
      id: "description",
      accessorKey: "description",
      header: t(`notification.description`),
      cell: ({ row }: { row: TableContent<NotificationInterface> }) => {
        const notification: NotificationInterface = row.original.jsonApiData;
        const data = generateNotificationData({ notification: notification, generateUrl: generateUrl });

        return (
          <p className="text-foreground text-sm">
            {t.rich(`notification.${notification.notificationType}.description` as any, {
              strong: (chunks: any) => <strong className="font-medium">{chunks}</strong>,
              actor: data.actor?.name ?? "",
              title: data.title,
              message: notification.message ?? "",
            })}
          </p>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [NotificationFields.createdAt]: () => ({
      id: "createdAt",
      accessorKey: "createdAt",
      header: t(`notification.createdAt`),
      meta: { className: "w-40" },
      cell: ({ row }: { row: TableContent<NotificationInterface> }) => {
        const notification: NotificationInterface = row.original.jsonApiData;

        /* Not `cellDate`: that renders the absolute shape, and the popover row
           shows how long ago it arrived. The two must match. */
        return (
          <span className="text-muted-foreground text-xs">
            {formatDate(new Date(notification.createdAt), "default")}
          </span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [NotificationFields.actions]: () => ({
      id: "actions",
      accessorKey: "actions",
      header: ``,
      meta: { className: "w-16" },
      cell: ({ row }: { row: TableContent<NotificationInterface> }) => {
        const notification: NotificationInterface = row.original.jsonApiData;

        return (
          <div className="flex flex-row items-center justify-end gap-x-1">
            {!archived && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant={`link`}
                      data-testid="notification-archive-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        archiveNotification(notification);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    />
                  }
                >
                  <ArchiveIcon className="h-4 w-4 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>{t(`notification.buttons.archive`)}</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<NotificationInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

/* Registered by module NAME, not by `Modules.Notification`: `Modules` is a
   Proxy that throws for any module the app has not bootstrapped yet, and this
   line runs while the module graph is still being evaluated — before
   `configureJsonApi` has had a chance to register anything. The lookup in
   `useTableGenerator` keys off `module.name`, so the two are equivalent. */
registerTableGenerator(NOTIFICATIONS_MODULE_NAME, useNotificationTableStructure);
