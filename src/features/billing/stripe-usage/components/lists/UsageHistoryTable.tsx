"use client";

import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../shadcnui";
import { SectionHeader } from "../../../../../components/typography";
import { type BillingFormatOptions, useBillingFormatOptions } from "../../../components/utils";
import { StripeUsageInterface } from "../../data/stripe-usage.interface";

type UsageHistoryTableProps = {
  usageRecords: StripeUsageInterface[];
};

/**
 * Format a date with time for usage history
 */
function formatDateTime(date: Date | string | undefined, { locale, t }: Required<BillingFormatOptions>): string {
  if (!date) return t("billing.ui.not_available");

  const dateObj = typeof date === "string" ? new Date(date) : date;

  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(dateObj);
  } catch (_error) {
    return t("billing.ui.invalid_date");
  }
}

export function UsageHistoryTable({ usageRecords }: UsageHistoryTableProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  if (usageRecords.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">{t("billing.ui.usage.history_empty")}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-4">
      <SectionHeader level={2}>{t("billing.ui.usage.history_title")}</SectionHeader>
      <div className="overflow-clip rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>{t("billing.ui.columns.date_time")}</TableHead>
              <TableHead>{t("billing.ui.columns.meter_event")}</TableHead>
              <TableHead className="text-end">{t("billing.ui.columns.quantity")}</TableHead>
              <TableHead>{t("billing.ui.columns.event_id")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usageRecords.map((record) => {
              const dateTime = formatDateTime(record.timestamp, fmt);
              const quantity = record.quantity.toLocaleString(fmt.locale);

              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{dateTime}</TableCell>
                  <TableCell className="text-muted-foreground">{record.meterEventName}</TableCell>
                  <TableCell className="text-end font-medium">{quantity}</TableCell>
                  <TableCell className="text-muted-foreground text-sm tabular-nums">{record.stripeEventId}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
