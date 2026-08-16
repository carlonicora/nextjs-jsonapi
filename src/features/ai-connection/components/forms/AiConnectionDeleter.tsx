"use client";

import { TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../components/errors";
import { Button, ConfirmDialog } from "../../../../shadcnui";
import { AiConnectionInterface, AiConnectionService } from "../../data";
import { useAiConnections } from "../../contexts/AiConnectionsContext";

export type AiConnectionDeleterProps = {
  connection: AiConnectionInterface;
};

/**
 * Removes one link from a fallback chain.
 *
 * Built on ConfirmDialog, which is controlled and trigger-less by design — the
 * caller owns the trigger button, so none of Base UI's trigger-composition
 * pitfalls apply (no asChild, no nested <button>). Mirrors ProductArchiver.
 */
export function AiConnectionDeleter({ connection }: AiConnectionDeleterProps) {
  const t = useTranslations();
  const { refresh } = useAiConnections();
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        aria-label={t("ai_connections.admin.delete.title")}
        onClick={() => setOpen(true)}
      >
        <TrashIcon />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("ai_connections.admin.delete.title")}
        description={t("ai_connections.admin.delete.description", { name: connection.name })}
        confirmLabel={t("ai_connections.admin.delete.confirm")}
        cancelLabel={t("ui.buttons.cancel")}
        destructive
        onConfirm={async () => {
          try {
            await AiConnectionService.delete({ id: connection.id });
            await refresh();
          } catch (error) {
            errorToast({ title: t("ai_connections.admin.delete.title"), error });
            throw error; // keeps the dialog open — ConfirmDialog swallows rejections
          }
        }}
      />
    </>
  );
}
