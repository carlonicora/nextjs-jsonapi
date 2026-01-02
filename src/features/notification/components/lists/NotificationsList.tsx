"use client";

import { ArchiveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever, usePageUrlGenerator } from "../../../../hooks";
import {
  Button,
  Card,
  CardContent,
  Link,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../shadcnui";
import { UserAvatar } from "../../../user/components";
import { NotificationInterface } from "../../data";
import { NotificationService } from "../../data/notification.service";
import { generateNotificationData } from "../notifications/Notification";

type NotificationsListProps = {
  archived: boolean;
};

export function NotificationsList({ archived }: NotificationsListProps) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const data: DataListRetriever<NotificationInterface> = useDataListRetriever({
    retriever: (params) => NotificationService.findMany(params),
    retrieverParams: { isArchived: archived },
    module: Modules.Notification,
  });

  const archiveNotification = async (notification: NotificationInterface) => {
    await NotificationService.archive({ id: notification.id });
    data.removeElement(notification);
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-2">
            <div className="flex w-full flex-row items-center">
              <Skeleton className="mr-4 h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {data.isLoaded ? (
        (data.data as NotificationInterface[])?.map((notification: NotificationInterface) => {
          const notificationData = generateNotificationData({ notification: notification, generateUrl: generateUrl });

          return (
            <Card key={notification.id}>
              <CardContent className="p-0">
                <div className={`flex w-full flex-row items-center p-2`}>
                  {notificationData.actor ? (
                    <div className="flex w-12 max-w-12 px-2">
                      <Link href={generateUrl({ page: Modules.User, id: notificationData.actor.id })}>
                        <UserAvatar user={notificationData.actor} className="h-8 w-8" />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex w-14 max-w-14 px-2"></div>
                  )}
                  <div className="flex w-full flex-col">
                    <p className="text-sm">
                      {t.rich(`foundations.notification.${notification.notificationType}.description` as any, {
                        strong: (chunks: any) => <strong>{chunks}</strong>,
                        actor: notificationData.actor?.name ?? "",
                        title: notificationData.title,
                      })}
                    </p>
                    <div className="text-muted-foreground mt-1 w-full text-xs">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-row items-center">
                    {notificationData.url ? (
                      <Link href={notificationData.url}>
                        <Button variant={`outline`} size={`sm`} onClick={(e) => e.stopPropagation()}>
                          {t(`foundations.notification.${notification.notificationType}.buttons.action` as any)}
                        </Button>
                      </Link>
                    ) : (
                      <></>
                    )}
                    {!archived && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant={`link`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              archiveNotification(notification);
                            }}
                            className="text-muted-foreground hover:text-destructive ml-2"
                          >
                            <ArchiveIcon className="h-4 w-4 cursor-pointer" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t(`foundations.notification.buttons.archive`)}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <LoadingSkeleton />
      )}
    </div>
  );
}
