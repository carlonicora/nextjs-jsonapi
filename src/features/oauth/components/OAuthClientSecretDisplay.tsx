"use client";

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
export function OAuthClientSecretDisplay({
  secret,
  onDismiss,
  open,
  clientName,
}: OAuthClientSecretDisplayProps) {
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
            Save Your Client Secret
          </DialogTitle>
          <DialogDescription>
            {clientName
              ? `Your client secret for "${clientName}" is shown below.`
              : "Your client secret is shown below."}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>This is the only time your client secret will be displayed.</strong>
            <br />
            Copy it now and store it securely. You will not be able to retrieve it later.
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Input
              value={secret}
              readOnly
              className="font-mono text-sm"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {copied && (
          <p className="text-sm text-green-600 text-center">Copied to clipboard!</p>
        )}

        <DialogFooter className="mt-4">
          <Button onClick={handleDismiss} className="w-full">
            I've Saved My Secret
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
