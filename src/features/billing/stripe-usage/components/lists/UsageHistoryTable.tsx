"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../shadcnui";
import { StripeUsageInterface } from "../../data/stripe-usage.interface";

type UsageHistoryTableProps = {
  usageRecords: StripeUsageInterface[];
};

/**
 * Format a date with time for usage history
 */
function formatDateTime(date: Date | string | undefined): string {
  if (!date) return "N/A";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(dateObj);
  } catch (error) {
    return "Invalid Date";
  }
}

export function UsageHistoryTable({ usageRecords }: UsageHistoryTableProps) {
  if (usageRecords.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No usage history available.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-4">
      <h2 className="text-xl font-semibold">Usage History</h2>
      <div className="overflow-clip rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Meter Event</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Event ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usageRecords.map((record) => {
              const dateTime = formatDateTime(record.timestamp);
              const quantity = record.quantity.toLocaleString();

              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{dateTime}</TableCell>
                  <TableCell className="text-muted-foreground">{record.meterEventName}</TableCell>
                  <TableCell className="text-right font-medium">{quantity}</TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono">{record.stripeEventId}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
