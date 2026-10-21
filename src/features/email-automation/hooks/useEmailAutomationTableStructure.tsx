"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Badge, Link } from "../../../shadcnui";
import { Modules } from "../../../core";
import { registerTableGenerator, TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../hooks";
import { EmailAutomationFields } from "../data/email-automation.fields";
import { EmailAutomationInterface } from "../data/EmailAutomationInterface";

/**
 * `context.triggerLabels` maps a trigger key to the label the API declares for
 * it (EmailAutomationsList loads them). A key the app no longer declares falls
 * back to the raw key, so a stale automation stays readable.
 */
export const useEmailAutomationTableStructure: UseTableStructureHook<
  EmailAutomationInterface,
  EmailAutomationFields
> = (params) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const triggerLabels: Record<string, string> = params.context?.triggerLabels ?? {};

  const tableData = useMemo(() => {
    return params.data.map((automation: EmailAutomationInterface) => {
      const entry: TableContent<EmailAutomationInterface> = { jsonApiData: automation };
      params.fields.forEach((field) => {
        entry[field] = (automation as any)[field as keyof EmailAutomationInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  // Typography role 15 (numeric): tabular-nums, end-aligned. NEVER
  // font-mono — no monospace font is loaded in these apps.
  const numericColumn = (
    field: EmailAutomationFields,
    header: string,
    read: (a: EmailAutomationInterface) => number,
  ) => ({
    id: field,
    accessorKey: field,
    header: header,
    cell: ({ row }: { row: TableContent<EmailAutomationInterface> }) => {
      const automation: EmailAutomationInterface = row.original.jsonApiData;
      return <span className="block text-xs tabular-nums text-end">{read(automation) ?? 0}</span>;
    },
    enableSorting: false,
    enableHiding: false,
  });

  const fieldColumnMap: Partial<Record<EmailAutomationFields, () => any>> = {
    [EmailAutomationFields.name]: () => ({
      id: "name",
      accessorKey: "name",
      header: t("emailAutomations.list.columns.name"),
      cell: ({ row }: { row: TableContent<EmailAutomationInterface> }) => {
        const automation: EmailAutomationInterface = row.original.jsonApiData;
        return <Link href={generateUrl({ page: Modules.EmailAutomation, id: automation.id })}>{automation.name}</Link>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailAutomationFields.trigger]: () => ({
      id: "trigger",
      accessorKey: "trigger",
      header: t("emailAutomations.list.columns.trigger"),
      cell: ({ row }: { row: TableContent<EmailAutomationInterface> }) => {
        const automation: EmailAutomationInterface = row.original.jsonApiData;
        if (!automation.trigger) return <span className="text-muted-foreground text-xs">—</span>;
        return <span className="text-sm">{triggerLabels[automation.trigger] ?? automation.trigger}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailAutomationFields.status]: () => ({
      id: "status",
      accessorKey: "status",
      header: t("emailAutomations.list.columns.status"),
      cell: ({ row }: { row: TableContent<EmailAutomationInterface> }) => {
        const automation: EmailAutomationInterface = row.original.jsonApiData;
        return automation.isActive ? (
          <Badge variant="softGreen">{t("emailAutomations.list.status.on")}</Badge>
        ) : (
          <Badge variant="softGray">{t("emailAutomations.list.status.off")}</Badge>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailAutomationFields.steps]: () =>
      numericColumn(EmailAutomationFields.steps, t("emailAutomations.list.columns.steps"), (a) => a.stepCount),
    [EmailAutomationFields.active]: () =>
      numericColumn(EmailAutomationFields.active, t("emailAutomations.list.columns.active"), (a) => a.activeCount),
    [EmailAutomationFields.completed]: () =>
      numericColumn(
        EmailAutomationFields.completed,
        t("emailAutomations.list.columns.completed"),
        (a) => a.completedCount,
      ),
    [EmailAutomationFields.unsubscribed]: () =>
      numericColumn(
        EmailAutomationFields.unsubscribed,
        t("emailAutomations.list.columns.unsubscribed"),
        (a) => a.unsubscribedCount,
      ),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<EmailAutomationInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("email-automations", useEmailAutomationTableStructure);
