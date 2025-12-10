"use client";

import { useTranslations } from "next-intl";
import { ReactElement, useEffect, useState } from "react";
import { usePageUrlGenerator } from "../../../../hooks";
import { Link } from "../../../../shadcnui";
import { UserInterface } from "../../../user";
import { UserAvatar } from "../../../user/components";
import { NotificationInterface } from "../../data";

type TaskCommentedOnProps = {
  notification: NotificationInterface;
  closePopover: () => void;
};

export const generateNotificationData = (params: {
  notification: NotificationInterface;
  generateUrl: any;
}): { title: string; actor?: UserInterface; url?: string; taskId?: string } => {
  const response: any = {};

  response.actor = params.notification.actor;

  return response;
};

export function NotificationToast(
  notification: NotificationInterface,
  t: any,
  generateUrl: any,
  reouter: any,
): {
  title: string;
  description: string | ReactElement<any>;
  action?: {
    label: string;
    onClick: () => void;
  };
} {
  const data = generateNotificationData({ notification: notification, generateUrl: generateUrl });

  return {
    title: t(`foundations.notification.${notification.notificationType}.title`),
    description: (
      <div className={`flex w-full flex-row items-center p-2`}>
        {data.actor ? (
          <div className="flex w-12 max-w-12 px-2">
            <UserAvatar user={data.actor} className="h-8 w-8" />
          </div>
        ) : (
          <div className="flex w-14 max-w-14 px-2"></div>
        )}
        <div className="flex w-full flex-col">
          <p className="text-sm">
            {t.rich(`foundations.notification.${notification.notificationType}.description`, {
              strong: (chunks: any) => <strong>{chunks}</strong>,
              actor: data.actor?.name ?? "",
              title: data.title,
            })}
          </p>
          <div className="text-muted-foreground mt-1 w-full text-xs">
            {new Date(notification.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    ),
    action: data.url
      ? {
          label: t(`foundations.notification.${notification.notificationType}.buttons.action`),
          onClick: () => {
            reouter.push(data.url!);
          },
        }
      : undefined,
  };
}

export function NotificationMenuItem({ notification, closePopover }: TaskCommentedOnProps) {
  const generateUrl = usePageUrlGenerator();
  const [isRead, setIsRead] = useState<boolean>(false);
  const t = useTranslations();

  useEffect(() => {
    setIsRead(notification.isRead);
  }, []);

  const data = generateNotificationData({ notification: notification, generateUrl: generateUrl });

  const response = (
    <div className={`flex w-full flex-row p-2 ${isRead ? "" : "bg-muted"} items-center`}>
      {data.actor ? (
        <div className="flex w-12 max-w-12 px-2">
          <UserAvatar user={data.actor} className="h-8 w-8" />
        </div>
      ) : (
        <div className="flex w-14 max-w-14 px-2"></div>
      )}
      <div className="flex w-full flex-col">
        <p className="text-sm">
          {t.rich(`foundations.notification.${notification.notificationType}.description` as any, {
            strong: (chunks: any) => <strong>{chunks}</strong>,
            actor: data.actor?.name ?? "",
            title: data.title,
          })}
        </p>
        <div className="text-muted-foreground mt-1 w-full text-xs">
          {new Date(notification.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );

  if (!data.url) return response;

  return (
    <Link href={data.url} onClick={closePopover}>
      {response}
    </Link>
  );
}
