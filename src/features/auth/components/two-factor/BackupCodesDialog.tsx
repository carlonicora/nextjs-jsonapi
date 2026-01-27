"use client";

import { Copy, Download, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../components/errors/errorToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { TwoFactorService } from "../../data/two-factor.service";

interface BackupCodesDialogProps {
  remainingCodes: number;
  onRegenerate: () => void;
  trigger?: React.ReactElement;
}

export function BackupCodesDialog({ remainingCodes, onRegenerate, trigger }: BackupCodesDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCodes, setShowCodes] = useState(false);

  const handleGenerate = async () => {
    console.log("[BackupCodesDialog] Generating new backup codes");
    setIsLoading(true);
    try {
      const newCodes = await TwoFactorService.generateBackupCodes();
      console.log("[BackupCodesDialog] Generated codes count:", newCodes.length);
      setCodes(newCodes);
      setShowCodes(true);
      onRegenerate();
    } catch (error) {
      console.error("[BackupCodesDialog] Failed to generate backup codes:", error);
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAll = async () => {
    const text = codes.join("\n");
    await navigator.clipboard.writeText(text);
    console.log("[BackupCodesDialog] Copied all backup codes to clipboard");
    showToast(t("auth.two_factor.codes_copied"));
  };

  const handleDownload = () => {
    const text = `Backup Codes\n\n${codes.join("\n")}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    console.log("[BackupCodesDialog] Downloaded backup codes");
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log("[BackupCodesDialog] Dialog open state changed:", newOpen);
    setOpen(newOpen);
    if (!newOpen) {
      setCodes([]);
      setShowCodes(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button variant="outline">{t("auth.two_factor.manage_backup_codes")}</Button>} />
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auth.two_factor.backup_codes")}</DialogTitle>
          <DialogDescription>
            {showCodes ? t("auth.two_factor.save_backup_codes") : t("auth.two_factor.backup_codes_description")}
          </DialogDescription>
        </DialogHeader>

        {!showCodes ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              {t("auth.two_factor.remaining_codes")}: <strong>{remainingCodes}</strong>
            </p>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("auth.two_factor.generate_new_codes")}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("auth.two_factor.regenerate_codes")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("auth.two_factor.regenerate_codes_warning")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.buttons.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleGenerate} disabled={isLoading}>
                    {t("auth.two_factor.generate")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {codes.map((code, index) => (
                <div key={index} className="text-center" data-testid={`backup-code-${index}`}>
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopyAll}>
                <Copy className="h-4 w-4 mr-2" />
                {t("auth.two_factor.copy_all")}
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                {t("auth.two_factor.download")}
              </Button>
            </div>
            <p className="text-xs text-destructive text-center">{t("auth.two_factor.codes_shown_once")}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
