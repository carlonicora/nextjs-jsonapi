"use client";

import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Alert,
  AlertDescription,
  Input,
} from "../../../shadcnui";

export interface OAuthClientSecretDisplayProps {
  /** The client secret to display */
  secret: string;
  /** Called when user dismisses the dialog */
  onDismiss: () => void;
  /** Whether the dialog is open */
  open: boolean;
  /** Optional client name for context */
  clientName?: string;
}

/**
 * Modal dialog for displaying a client secret ONE TIME
 * Shows warning that secret cannot be retrieved again
 *
 * @example
 * ```tsx
 * const [secret, setSecret] = useAtom(oauthNewClientSecretAtom);
 *
 * <OAuthClientSecretDisplay
 *   secret={secret || ''}
 *   open={!!secret}
 *   onDismiss={() => setSecret(null)}
 * />
 * ```
 */
export function OAuthClientSecretDisplay({ secret, onDismiss, open, clientName }: OAuthClientSecretDisplayProps) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, [secret]);

  const handleDismiss = useCallback(() => {
    setCopied(false);
    onDismiss();
  }, [onDismiss]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {t("oauth.ui.secret_display.title")}
          </DialogTitle>
          <DialogDescription>
            {clientName
              ? t("oauth.ui.secret_display.description_named", { name: clientName })
              : t("oauth.ui.secret_display.description")}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{t("oauth.ui.secret_display.warning_title")}</strong>
            <br />
            {t("oauth.ui.secret_display.warning_body")}
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Input value={secret} readOnly className="tabular-nums text-sm" onClick={(e) => e.currentTarget.select()} />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            title={copied ? t("oauth.ui.secret_display.copied_short") : t("oauth.ui.secret_display.copy_to_clipboard")}
          >
            {copied ? <Check className="text-success h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {copied && <p className="text-success text-center text-sm">{t("oauth.ui.secret_display.copied")}</p>}

        <DialogFooter className="mt-4">
          <Button onClick={handleDismiss} className="w-full">
            {t("oauth.ui.secret_display.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
