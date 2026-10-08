"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { TableContent, UseTableStructureHook } from "../../../hooks";
import { useI18nLocale } from "../../../i18n";
import { Badge, Button } from "../../../shadcnui";
import { WaitlistFields } from "../data/waitlist.fields";
import { WaitlistInterface, WaitlistStatus } from "../data/WaitlistInterface";

/**
 * Parse questionnaire JSON string safely
 */
function parseQuestionnaire(questionnaire: string | undefined): Record<string, any> | null {
  if (!questionnaire) return null;
  try {
    return JSON.parse(questionnaire);
  } catch {
    return null;
  }
}

/**
 * Columns for the administrative waitlist. The invite action needs the list's
 * own handler, so WaitlistList passes it through ContentListTable's `context`
 * as `onInvite`.
 */
export const useWaitlistTableStructure: UseTableStructureHook<WaitlistInterface, WaitlistFields> = (params) => {
  const t = useTranslations();
  const locale = useI18nLocale();
  const onInvite: ((entry: WaitlistInterface) => void) | undefined = params.context?.onInvite;

  const tableData = useMemo(() => {
    return params.data.map((entry: WaitlistInterface) => {
      const row: TableContent<WaitlistInterface> = { jsonApiData: entry };
      row[WaitlistFields.waitlistId] = entry.id;
      params.fields.forEach((field) => {
        row[field] = (entry as any)[field as keyof WaitlistInterface];
      });
      return row;
    });
  }, [params.data, params.fields]);

  const getStatusBadge = (status: WaitlistStatus) => {
    const variants: Record<WaitlistStatus, { variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pending: { variant: "secondary" },
      confirmed: { variant: "default" },
      invited: { variant: "outline" },
      registered: { variant: "default" },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{t(`waitlist.admin.status.${status}`)}</Badge>;
  };

  const fieldColumnMap: Partial<Record<WaitlistFields, () => any>> = {
    [WaitlistFields.email]: () => ({
      id: "email",
      accessorKey: "email",
      header: t("waitlist.admin.columns.email"),
      cell: ({ row }: { row: TableContent<WaitlistInterface> }) => (
        <span className="font-medium">{row.original.jsonApiData.email}</span>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    [WaitlistFields.status]: () => ({
      id: "status",
      accessorKey: "status",
      header: t("waitlist.admin.columns.status"),
      cell: ({ row }: { row: TableContent<WaitlistInterface> }) => getStatusBadge(row.original.jsonApiData.status),
      enableSorting: false,
      enableHiding: false,
    }),
    [WaitlistFields.createdAt]: () => ({
      id: "createdAt",
      accessorKey: "createdAt",
      header: t("waitlist.admin.columns.submitted"),
      cell: ({ row }: { row: TableContent<WaitlistInterface> }) => {
        const entry: WaitlistInterface = row.original.jsonApiData;
        if (!entry.createdAt) return "-";
        return new Date(entry.createdAt).toLocaleDateString(locale);
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [WaitlistFields.questionnaire]: () => ({
      id: "questionnaire",
      accessorKey: "questionnaire",
      header: t("waitlist.admin.columns.questionnaire"),
      cell: ({ row }: { row: TableContent<WaitlistInterface> }) => {
        // IMPORTANT: Parse JSON string from backend
        const questionnaire = parseQuestionnaire(row.original.jsonApiData.questionnaire);
        if (!questionnaire || Object.keys(questionnaire).length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <details className="cursor-pointer">
            <summary className="text-primary text-sm">{t("waitlist.admin.questionnaire.view_answers")}</summary>
            <div className="bg-muted mt-2 rounded p-2 text-sm">
              {Object.entries(questionnaire).map(([key, value]) => (
                <div key={key} className="mb-1">
                  <span className="font-medium">{key}:</span>{" "}
                  <span className="text-muted-foreground">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </details>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [WaitlistFields.actions]: () => ({
      id: "actions",
      header: t("waitlist.admin.columns.actions"),
      cell: ({ row }: { row: TableContent<WaitlistInterface> }) => {
        const entry: WaitlistInterface = row.original.jsonApiData;

        if (entry.status === "confirmed") {
          return (
            <Button size="sm" variant="outline" onClick={() => onInvite?.(entry)}>
              <Send className="me-2 h-4 w-4" />
              {t("waitlist.admin.actions.invite")}
            </Button>
          );
        }

        if (entry.status === "invited" && entry.invitedAt) {
          return (
            <span className="text-muted-foreground text-xs">
              {t("waitlist.admin.actions.invited_on", { date: new Date(entry.invitedAt).toLocaleDateString(locale) })}
            </span>
          );
        }

        if (entry.status === "registered") {
          return <span className="text-muted-foreground text-sm">{t("waitlist.admin.actions.registered")}</span>;
        }

        return (
          <span className="text-muted-foreground text-sm">{t("waitlist.admin.actions.awaiting_confirmation")}</span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<WaitlistInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, locale]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};
