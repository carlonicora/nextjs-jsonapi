"use client";

import { useTranslations } from "next-intl";
import { cn } from "../../../../utils";

export type NotificationViewMode = "inbox" | "archived";

const MODES: { key: NotificationViewMode; labelKey: string }[] = [
  { key: "inbox", labelKey: "notification.inbox" },
  { key: "archived", labelKey: "notification.archived" },
];

type NotificationViewSwitcherProps = {
  value: NotificationViewMode;
  onChange: (mode: NotificationViewMode) => void;
};

/**
 * Inbox / Archived selector for the notifications list header.
 *
 * A segmented control rather than a `TabsList`: it sits inside
 * `ContentListTable`'s title row, which is the page header on a `fullWidth`
 * `RoundPageContainer`, and a full-height tab strip does not fit there.
 */
export function NotificationViewSwitcher({ value, onChange }: NotificationViewSwitcherProps) {
  const t = useTranslations();

  return (
    <div className="bg-muted inline-flex items-center rounded-md p-0.5">
      {MODES.map((mode) => (
        <button
          key={mode.key}
          type="button"
          data-testid={`notification-view-${mode.key}`}
          onClick={() => onChange(mode.key)}
          className={cn(
            "rounded-sm px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
            value === mode.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(mode.labelKey)}
        </button>
      ))}
    </div>
  );
}
