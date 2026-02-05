"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../shadcnui";
import { isReferralEnabled } from "../config";
import { ReferralWidget, ReferralWidgetProps, ReferralWidgetTranslations } from "./ReferralWidget";

/**
 * Translation strings for the ReferralDialog component.
 * Extends ReferralWidgetTranslations with dialog-specific strings.
 */
export interface ReferralDialogTranslations extends ReferralWidgetTranslations {
  /** Dialog title */
  dialogTitle?: string;
  /** Dialog description */
  dialogDescription?: string;
}

/**
 * Default translations for ReferralDialog.
 */
const DEFAULT_DIALOG_TRANSLATIONS: Required<Pick<ReferralDialogTranslations, "dialogTitle" | "dialogDescription">> = {
  dialogTitle: "Invite Friends",
  dialogDescription: "Share your referral link and earn rewards when your friends subscribe.",
};

/**
 * Props for the ReferralDialog component.
 */
export interface ReferralDialogProps extends Omit<ReferralWidgetProps, "isDialog" | "translations"> {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Custom translations to override defaults */
  translations?: ReferralDialogTranslations;
  /** Additional CSS class name for the dialog content */
  dialogClassName?: string;
}

/**
 * ReferralDialog displays the ReferralWidget in a modal dialog.
 *
 * Features:
 * - Feature flag awareness (renders null when disabled)
 * - Uses shadcn Dialog components
 * - Passes through all ReferralWidget props
 * - Customizable translations including dialog-specific text
 *
 * @example
 * ```tsx
 * import { ReferralDialog } from "@carlonicora/nextjs-jsonapi/components";
 *
 * // Basic usage
 * const [open, setOpen] = useState(false);
 * <ReferralDialog open={open} onOpenChange={setOpen} />
 *
 * // With custom translations
 * <ReferralDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   translations={{
 *     dialogTitle: t("referral.title"),
 *     dialogDescription: t("referral.description"),
 *     yourLink: t("referral.yourLink"),
 *   }}
 * />
 * ```
 */
export function ReferralDialog({
  open,
  onOpenChange,
  translations,
  dialogClassName,
  ...widgetProps
}: ReferralDialogProps) {
  // Render nothing when disabled
  if (!isReferralEnabled()) {
    return null;
  }

  const t = { ...DEFAULT_DIALOG_TRANSLATIONS, ...translations };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogClassName ?? "max-w-md"}>
        <DialogHeader>
          <DialogTitle>{t.dialogTitle}</DialogTitle>
          <DialogDescription>{t.dialogDescription}</DialogDescription>
        </DialogHeader>
        <ReferralWidget {...widgetProps} translations={translations} isDialog />
      </DialogContent>
    </Dialog>
  );
}
