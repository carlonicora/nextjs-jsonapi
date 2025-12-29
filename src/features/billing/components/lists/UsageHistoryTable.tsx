"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shadcnui";
import { UsageRecordInterface } from "../../data/billing.interface";

type UsageHistoryTableProps = {
  usageRecords: UsageRecordInterface[];
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
  console.log("[UsageHistoryTable] Rendering usage records:", usageRecords);

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
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Subscription Item</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usageRecords.map((record) => {
              const dateTime = formatDateTime(record.timestamp);
              const quantity = record.quantity.toLocaleString();
              const action = record.action;

              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{dateTime}</TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono">{record.subscriptionItemId}</TableCell>
                  <TableCell className="text-right font-medium">{quantity}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        action === "increment" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {action}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
