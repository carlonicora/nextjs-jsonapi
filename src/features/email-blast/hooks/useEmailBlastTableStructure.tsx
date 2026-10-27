"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Badge, Link } from "../../../shadcnui";
import { Modules } from "../../../core";
import { registerTableGenerator, TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../hooks";
import { useI18nLocale } from "../../../i18n";
import { EmailBlastFields } from "../data/email-blast.fields";
import { EmailBlastInterface, EmailBlastStatus } from "../data/EmailBlastInterface";

const STATUS_VARIANTS: Record<EmailBlastStatus, "softGray" | "softAmber" | "softGreen"> = {
  draft: "softGray",
  sending: "softAmber",
  sent: "softGreen",
};

export const useEmailBlastTableStructure: UseTableStructureHook<EmailBlastInterface, EmailBlastFields> = (params) => {
  const t = useTranslations();
  const locale = useI18nLocale();
  const generateUrl = usePageUrlGenerator();

  const tableData = useMemo(() => {
    return params.data.map((blast: EmailBlastInterface) => {
      const entry: TableContent<EmailBlastInterface> = { jsonApiData: blast };
      params.fields.forEach((field) => {
        entry[field] = (blast as any)[field as keyof EmailBlastInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  // Typography role 15 (numeric): tabular-nums, end-aligned. NEVER
  // font-mono — no monospace font is loaded in these apps.
  const numericColumn = (field: EmailBlastFields, header: string, read: (b: EmailBlastInterface) => number) => ({
    id: field,
    accessorKey: field,
    header: header,
    cell: ({ row }: { row: TableContent<EmailBlastInterface> }) => {
      const blast: EmailBlastInterface = row.original.jsonApiData;
      return <span className="block text-xs tabular-nums text-end">{read(blast) ?? 0}</span>;
    },
    enableSorting: false,
    enableHiding: false,
  });

  const fieldColumnMap: Partial<Record<EmailBlastFields, () => any>> = {
    [EmailBlastFields.subject]: () => ({
      id: "subject",
      accessorKey: "subject",
      header: t("emailBlasts.list.columns.subject"),
      cell: ({ row }: { row: TableContent<EmailBlastInterface> }) => {
        const blast: EmailBlastInterface = row.original.jsonApiData;
        return <Link href={generateUrl({ page: Modules.EmailBlast, id: blast.id })}>{blast.subject}</Link>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailBlastFields.status]: () => ({
      id: "status",
      accessorKey: "status",
      header: t("emailBlasts.list.columns.status"),
      cell: ({ row }: { row: TableContent<EmailBlastInterface> }) => {
        const blast: EmailBlastInterface = row.original.jsonApiData;
        return <Badge variant={STATUS_VARIANTS[blast.status]}>{t(`emailBlasts.list.status.${blast.status}`)}</Badge>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailBlastFields.sentAt]: () => ({
      id: "sentAt",
      accessorKey: "sentAt",
      header: t("emailBlasts.list.columns.sentAt"),
      cell: ({ row }: { row: TableContent<EmailBlastInterface> }) => {
        const blast: EmailBlastInterface = row.original.jsonApiData;
        if (!blast.sentAt) return <span className="text-muted-foreground text-xs">—</span>;
        return <span className="text-sm">{blast.sentAt.toLocaleDateString(locale)}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailBlastFields.sent]: () =>
      numericColumn(EmailBlastFields.sent, t("emailBlasts.list.columns.sent"), (b) => b.sentCount),
    [EmailBlastFields.failed]: () =>
      numericColumn(EmailBlastFields.failed, t("emailBlasts.list.columns.failed"), (b) => b.failedCount),
    [EmailBlastFields.unsubscribed]: () =>
      numericColumn(
        EmailBlastFields.unsubscribed,
        t("emailBlasts.list.columns.unsubscribed"),
        (b) => b.unsubscribedCount,
      ),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<EmailBlastInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl, locale]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("email-blasts", useEmailBlastTableStructure);
