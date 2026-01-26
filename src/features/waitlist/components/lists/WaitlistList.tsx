"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { RefreshCw, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { errorToast } from "../../../../components";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { WaitlistInterface } from "../../data/WaitlistInterface";
import { WaitlistService } from "../../data/WaitlistService";
import { useWaitlistTableStructure } from "../../hooks/useWaitlistTableStructure";

export function WaitlistList() {
  const t = useTranslations();
  const [entries, setEntries] = useState<WaitlistInterface[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await WaitlistService.findMany({
        status: statusFilter === "all" ? undefined : statusFilter,
        fetchAll: true,
      });
      setEntries(result);
      setTotal(result.length);
    } catch (error) {
      errorToast({ error });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleInvite = async (entry: WaitlistInterface) => {
    try {
      await WaitlistService.invite(entry.id);
      showToast(t("waitlist.admin.invite_sent", { email: entry.email }));
      loadEntries();
    } catch (error) {
      errorToast({ error });
    }
  };

  const columns = useWaitlistTableStructure({ onInvite: handleInvite });

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{t("waitlist.admin.title")}</h2>
          <span className="text-muted-foreground">({t("waitlist.admin.entries_count", { count: total })})</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("waitlist.admin.filter_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("waitlist.admin.all_statuses")}</SelectItem>
              <SelectItem value="pending">{t("waitlist.admin.status.pending")}</SelectItem>
              <SelectItem value="confirmed">{t("waitlist.admin.status.confirmed")}</SelectItem>
              <SelectItem value="invited">{t("waitlist.admin.status.invited")}</SelectItem>
              <SelectItem value="registered">{t("waitlist.admin.status.registered")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button variant="outline" size="icon" onClick={loadEntries} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("waitlist.admin.loading")}
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("waitlist.admin.empty")}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
