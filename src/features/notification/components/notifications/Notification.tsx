"use client";

import { useTranslations } from "next-intl";
import { ReactElement, useEffect, useState } from "react";
import { usePageUrlGenerator } from "../../../../hooks";
import { Link } from "../../../../shadcnui";
import { formatDate } from "../../../../utils";
import { UserInterface } from "../../../user";
import { UserAvatar } from "../../../user/components";
import { NotificationInterface } from "../../data";
import { NotificationIcon } from "./NotificationIcon";

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

  // Use actionUrl from notification if available (for notifications without actor relationships)
  if (params.notification.actionUrl) {
    response.url = params.notification.actionUrl;
  }

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
    title: t(`notification.${notification.notificationType}.title`),
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
            {t.rich(`notification.${notification.notificationType}.description`, {
              strong: (chunks: any) => <strong>{chunks}</strong>,
              actor: data.actor?.name ?? "",
              title: data.title,
              message: notification.message ?? "",
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
          label: t(`notification.${notification.notificationType}.buttons.action`),
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
    /* Unread is marked with a tinted row + dot, not the muted background the
       row used to carry: grey-on-grey reads as disabled, the opposite of
       "needs your attention". */
    <div
      className={`hover:bg-accent flex w-full flex-row items-start gap-3 px-3 py-2.5 transition-colors ${isRead ? "" : "bg-primary/5"}`}
    >
      <NotificationIcon notificationType={notification.notificationType} />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-foreground text-sm">
          {t.rich(`notification.${notification.notificationType}.description` as any, {
            strong: (chunks: any) => <strong className="font-medium">{chunks}</strong>,
            actor: data.actor?.name ?? "",
            title: data.title,
            message: notification.message ?? "",
          })}
        </p>
        <div className="text-muted-foreground mt-0.5 text-xs">
          {formatDate(new Date(notification.createdAt), "default")}
        </div>
      </div>
      {!isRead && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" aria-hidden />}
    </div>
  );

  if (!data.url) return response;

  /* The whole row is the click target, so the package Link's text-primary
     font-medium (typography role 14 — inline navigational text) would paint
     every notification blue. Emphasis inside the sentence comes from weight. */
  return (
    <Link href={data.url} onClick={closePopover} className="text-foreground block font-normal">
      {response}
    </Link>
  );
}
