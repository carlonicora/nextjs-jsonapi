"use client";

import { AudioLinesIcon, BellIcon, LucideIcon } from "lucide-react";
import { cn } from "../../../../utils";

type IconTone = "muted" | "warning" | "destructive";

/* Every row carries a glyph in the same 32px circle, which keeps the left rail
   aligned and gives the eye a faster channel than reading the sentence. Types
   not listed here fall back to the bell. */
const notificationIcons: Record<string, { icon: LucideIcon; tone: IconTone }> = {
  transcript_ready: { icon: AudioLinesIcon, tone: "muted" },
};

const toneClasses: Record<IconTone, string> = {
  muted: "bg-muted text-muted-foreground",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

type NotificationIconProps = {
  notificationType: string;
  className?: string;
};

export function NotificationIcon({ notificationType, className }: NotificationIconProps) {
  const { icon: Icon, tone } = notificationIcons[notificationType] ?? { icon: BellIcon, tone: "muted" as IconTone };

  return (
    <div
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", toneClasses[tone], className)}
      aria-hidden
    >
      <Icon className="size-4" />
    </div>
  );
}
