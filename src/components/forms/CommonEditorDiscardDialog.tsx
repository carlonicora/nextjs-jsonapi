"use client";

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../shadcnui";

type CommonEditorDiscardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
};

export function CommonEditorDiscardDialog({ open, onOpenChange, onDiscard }: CommonEditorDiscardDialogProps) {
  const t = useTranslations();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`ui.dialogs.unsaved_changes_title`)}</AlertDialogTitle>
          <AlertDialogDescription>{t(`ui.dialogs.unsaved_changes_description`)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t(`ui.buttons.cancel`)}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDiscard}>
            {t(`ui.dialogs.unsaved_changes_discard`)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
