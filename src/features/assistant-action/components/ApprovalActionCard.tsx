"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { MicroLabel } from "../../../components/typography";
import { Badge, Button } from "../../../shadcnui";
import type { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import type { AssistantActionStatus } from "../data/AssistantActionInterface";
import { AssistantActionService } from "../data/AssistantActionService";

/**
 * Status pill variants. Soft `Badge` variants only — a hand-rolled
 * `bg-*-100 text-*-800` span is never a status pill (typography rule 8).
 */
const STATUS_VARIANT: Record<AssistantActionStatus, "softBlue" | "softGreen" | "softRed" | "softGray"> = {
  pending: "softBlue",
  approved: "softBlue",
  executed: "softGreen",
  denied: "softRed",
  failed: "softRed",
  expired: "softGray",
};

/**
 * Literal i18n keys (not a template literal) so the key set stays greppable
 * and every one of them can be verified against the app's messages file.
 */
const STATUS_LABEL_KEY: Record<AssistantActionStatus, string> = {
  pending: "features.assistant.approval.status.pending",
  approved: "features.assistant.approval.status.approved",
  executed: "features.assistant.approval.status.executed",
  denied: "features.assistant.approval.status.denied",
  failed: "features.assistant.approval.status.failed",
  expired: "features.assistant.approval.status.expired",
};

interface Props {
  /** Id of the pending AssistantAction linked to the approval-request message. */
  actionId: string;
  /** Human-readable summary fallback (the approval-request message content). */
  summary?: string;
  /** Invoked with the resumed assistant message returned by approve/deny. */
  onResolved?: (message: AssistantMessageInterface) => void;
}

/**
 * Renders an `approval-request` assistant message as an action card:
 * the destructive-tool summary plus Approve / Deny buttons. Buttons are
 * only actionable while the underlying AssistantAction is `pending`.
 *
 * NOTE: plain `<Button>` elements on purpose — never wrapped inside any
 * Base UI trigger component (no nested buttons, no `asChild`).
 */
export function ApprovalActionCard({ actionId, summary, onResolved }: Props) {
  const t = useTranslations();
  const [status, setStatus] = useState<AssistantActionStatus | undefined>(undefined);
  const [actionSummary, setActionSummary] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const action = await AssistantActionService.findOne({ id: actionId });
        if (cancelled || !action) return;
        setStatus(action.status);
        setActionSummary(action.summary);
      } catch (error) {
        console.error(`ApprovalActionCard: failed to fetch assistant action ${actionId}`, error);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actionId]);

  const actionable = status === "pending" && !busy && !failed;

  const resolve = async (kind: "approve" | "deny") => {
    if (!actionable) return;
    setBusy(true);
    try {
      const message =
        kind === "approve"
          ? await AssistantActionService.approve({ id: actionId })
          : await AssistantActionService.deny({ id: actionId });
      setStatus(kind === "approve" ? "executed" : "denied");
      if (message) onResolved?.(message);
    } catch (error) {
      console.error(`ApprovalActionCard: failed to ${kind} assistant action ${actionId}`, error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-border bg-muted/30 flex flex-col gap-2 rounded-xl border p-3.5">
      <MicroLabel className="flex items-center gap-2">
        <ShieldAlert className="text-warning h-3.5 w-3.5" />
        <span>{t("features.assistant.approval.title")}</span>
        {status && status !== "pending" && (
          <Badge variant={STATUS_VARIANT[status]} className="ms-auto tracking-normal normal-case">
            {t(STATUS_LABEL_KEY[status])}
          </Badge>
        )}
      </MicroLabel>
      <div className="text-foreground text-sm leading-relaxed">{actionSummary ?? summary}</div>
      {failed && (
        <div role="alert" className="text-destructive text-xs/relaxed">
          {t("features.assistant.approval.error")}
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" disabled={!actionable} onClick={() => void resolve("approve")}>
          {t("features.assistant.approval.approve")}
        </Button>
        <Button size="sm" variant="outline" disabled={!actionable} onClick={() => void resolve("deny")}>
          {t("features.assistant.approval.deny")}
        </Button>
      </div>
    </div>
  );
}
