"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge, Button } from "../../../shadcnui";
import { WaitlistInterface, WaitlistStatus } from "../data/WaitlistInterface";

interface UseWaitlistTableStructureProps {
  onInvite: (entry: WaitlistInterface) => void;
}

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

export function useWaitlistTableStructure({
  onInvite,
}: UseWaitlistTableStructureProps): ColumnDef<WaitlistInterface>[] {
  const t = useTranslations();

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

  return [
    {
      accessorKey: "email",
      header: t("waitlist.admin.columns.email"),
      cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
    },
    {
      accessorKey: "status",
      header: t("waitlist.admin.columns.status"),
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "createdAt",
      header: t("waitlist.admin.columns.submitted"),
      cell: ({ row }) => {
        if (!row.original.createdAt) return "-";
        return new Date(row.original.createdAt).toLocaleDateString();
      },
    },
    {
      accessorKey: "questionnaire",
      header: t("waitlist.admin.columns.questionnaire"),
      cell: ({ row }) => {
        // IMPORTANT: Parse JSON string from backend
        const questionnaire = parseQuestionnaire(row.original.questionnaire);
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
    },
    {
      id: "actions",
      header: t("waitlist.admin.columns.actions"),
      cell: ({ row }) => {
        const entry = row.original;

        if (entry.status === "confirmed") {
          return (
            <Button size="sm" variant="outline" onClick={() => onInvite(entry)}>
              <Send className="mr-2 h-4 w-4" />
              {t("waitlist.admin.actions.invite")}
            </Button>
          );
        }

        if (entry.status === "invited" && entry.invitedAt) {
          return (
            <span className="text-muted-foreground text-sm">
              {t("waitlist.admin.actions.invited_on", { date: new Date(entry.invitedAt).toLocaleDateString() })}
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
    },
  ];
}
