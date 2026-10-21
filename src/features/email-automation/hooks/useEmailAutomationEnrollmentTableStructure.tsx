"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Badge } from "../../../shadcnui";
import { registerTableGenerator, TableContent, UseTableStructureHook } from "../../../hooks";
import { dateFormatLocale, formatDate } from "../../../utils/date-formatter";
import { EmailAutomationEnrollmentFields } from "../data/email-automation-enrollment.fields";
import { EmailAutomationEnrollmentInterface } from "../data/EmailAutomationEnrollmentInterface";

const STATUS_VARIANTS: Record<string, "softGreen" | "softBlue" | "softGray" | "softRed"> = {
  active: "softGreen",
  completed: "softBlue",
  unsubscribed: "softGray",
  exited: "softGray",
  failed: "softRed",
};

export const useEmailAutomationEnrollmentTableStructure: UseTableStructureHook<
  EmailAutomationEnrollmentInterface,
  EmailAutomationEnrollmentFields
> = (params) => {
  const t = useTranslations();
  const locale = dateFormatLocale(useLocale());

  const tableData = useMemo(() => {
    return params.data.map((enrollment: EmailAutomationEnrollmentInterface) => {
      const entry: TableContent<EmailAutomationEnrollmentInterface> = { jsonApiData: enrollment };
      params.fields.forEach((field) => {
        entry[field] = (enrollment as any)[field as keyof EmailAutomationEnrollmentInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const empty = <span className="text-muted-foreground text-xs">—</span>;

  const fieldColumnMap: Partial<Record<EmailAutomationEnrollmentFields, () => any>> = {
    [EmailAutomationEnrollmentFields.email]: () => ({
      id: "email",
      accessorKey: "email",
      header: t("emailAutomations.recipients.columns.email"),
      cell: ({ row }: { row: TableContent<EmailAutomationEnrollmentInterface> }) => {
        const enrollment: EmailAutomationEnrollmentInterface = row.original.jsonApiData;
        return <span className="text-sm">{enrollment.email}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailAutomationEnrollmentFields.name]: () => ({
      id: "name",
      accessorKey: "name",
      header: t("emailAutomations.recipients.columns.name"),
      cell: ({ row }: { row: TableContent<EmailAutomationEnrollmentInterface> }) => {
        const enrollment: EmailAutomationEnrollmentInterface = row.original.jsonApiData;
        return enrollment.name ? <span className="text-sm">{enrollment.name}</span> : empty;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailAutomationEnrollmentFields.status]: () => ({
      id: "status",
      accessorKey: "status",
      header: t("emailAutomations.recipients.columns.status"),
      cell: ({ row }: { row: TableContent<EmailAutomationEnrollmentInterface> }) => {
        const enrollment: EmailAutomationEnrollmentInterface = row.original.jsonApiData;
        return (
          <Badge
            variant={STATUS_VARIANTS[enrollment.status] ?? "softGray"}
            title={enrollment.status === "failed" ? enrollment.lastError : undefined}
          >
            {t(`emailAutomations.recipients.status.${enrollment.status}`)}
          </Badge>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailAutomationEnrollmentFields.currentStep]: () => ({
      id: "currentStep",
      accessorKey: "currentStep",
      header: t("emailAutomations.recipients.columns.currentStep"),
      cell: ({ row }: { row: TableContent<EmailAutomationEnrollmentInterface> }) => {
        const enrollment: EmailAutomationEnrollmentInterface = row.original.jsonApiData;
        return enrollment.currentStepSubject ? <span className="text-sm">{enrollment.currentStepSubject}</span> : empty;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailAutomationEnrollmentFields.nextSendAt]: () => ({
      id: "nextSendAt",
      accessorKey: "nextSendAt",
      header: t("emailAutomations.recipients.columns.nextSendAt"),
      cell: ({ row }: { row: TableContent<EmailAutomationEnrollmentInterface> }) => {
        const enrollment: EmailAutomationEnrollmentInterface = row.original.jsonApiData;
        if (!enrollment.nextSendAt) return empty;
        return <span className="text-xs tabular-nums">{formatDate(enrollment.nextSendAt, "dateTime", locale)}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [EmailAutomationEnrollmentFields.sentCount]: () => ({
      id: "sentCount",
      accessorKey: "sentCount",
      header: t("emailAutomations.recipients.columns.sentCount"),
      cell: ({ row }: { row: TableContent<EmailAutomationEnrollmentInterface> }) => {
        const enrollment: EmailAutomationEnrollmentInterface = row.original.jsonApiData;
        // Typography role 15 (numeric): tabular-nums, end-aligned.
        return <span className="block text-xs tabular-nums text-end">{enrollment.sentCount ?? 0}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<EmailAutomationEnrollmentInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, locale]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("email-automation-enrollments", useEmailAutomationEnrollmentTableStructure);
