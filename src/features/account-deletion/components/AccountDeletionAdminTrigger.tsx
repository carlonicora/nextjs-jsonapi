"use client";

import { LoaderCircleIcon, UserXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { errorToast } from "../../../components/errors/errorToast";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { useI18nLocale } from "../../../i18n";
import { getRoleId } from "../../../roles";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../shadcnui/ui/alert-dialog";
import { Button } from "../../../shadcnui/ui/button";
import { Input } from "../../../shadcnui/ui/input";
import { Label } from "../../../shadcnui/ui/label";
import { useCurrentUserContext } from "../../user/contexts/CurrentUserContext";
import { UserInterface } from "../../user/data/user.interface";
import { AccountDeletionInterface } from "../data/account-deletion.interface";
import { AccountDeletionService } from "../data/account-deletion.service";

/** Must match the API's default `accountDeletion.graceDays`. */
const GRACE_DAYS = 7;

/** The words an undeliverable-email user (or an admin on their behalf) types. Same rule as the API. */
const CONFIRMATION_WORDS = ["DELETE", "ELIMINA"];

export type AccountDeletionAdminTriggerProps = {
  user: UserInterface;
};

/**
 * True when the app registered AccountDeletionModule (the feature is opt-in).
 */
export function isAccountDeletionEnabled(): boolean {
  return ModuleRegistry.has("AccountDeletion");
}

function matchesConfirmation(status: AccountDeletionInterface, email: string, value: string): boolean {
  if (status.hasDeliverableEmail) return value.trim().toLowerCase() === email.trim().toLowerCase();
  return CONFIRMATION_WORDS.includes(value.trim().toUpperCase());
}

function AccountDeletionAdminTriggerInternal({ user }: AccountDeletionAdminTriggerProps) {
  const t = useTranslations();
  const locale = useI18nLocale();
  const [status, setStatus] = useState<AccountDeletionInterface | undefined>();
  const [open, setOpen] = useState<boolean>(false);
  const [confirmation, setConfirmation] = useState<string>("");
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    AccountDeletionService.findByUser({ userId: user.id })
      .then((response) => {
        if (!cancelled) setStatus(response);
      })
      .catch(() => {
        if (!cancelled) setStatus(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  if (!status) return null;

  const formatDate = (date: Date) =>
    date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

  if (status.scheduledAt) {
    return (
      <span className="text-destructive text-xs font-medium">
        {t("accountDeletion.admin.pending", { date: formatDate(status.scheduledAt) })}
      </span>
    );
  }

  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + GRACE_DAYS);

  const expected = status.hasDeliverableEmail ? user.email : t("accountDeletion.admin.confirmWord");
  const canConfirm = matchesConfirmation(status, user.email, confirmation);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) setConfirmation("");
  };

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      const response = await AccountDeletionService.requestForUser({ id: user.id, confirmation });
      if (response) setStatus(response);
      handleOpenChange(false);
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            aria-label={t("accountDeletion.admin.trigger")}
            title={t("accountDeletion.admin.trigger")}
          />
        }
      >
        <UserXIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="flex max-h-[70vh] max-w-3xl flex-col overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("accountDeletion.admin.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {status.hasDeliverableEmail
              ? t("accountDeletion.admin.body", { date: formatDate(deletionDate) })
              : t("accountDeletion.admin.bodyNoEmail", { date: formatDate(deletionDate) })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {status.hasActiveSubscription && (
          <p className="text-destructive text-sm">{t("accountDeletion.admin.subscription")}</p>
        )}
        <div className="flex w-full flex-col gap-y-2">
          <Label htmlFor="account-deletion-admin-confirmation">
            {t("accountDeletion.admin.confirmLabel", { value: expected })}
          </Label>
          <Input
            id="account-deletion-admin-confirmation"
            className="w-full"
            autoComplete="off"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button
            className="me-2"
            variant="outline"
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={isRequesting}
          >
            {t("ui.buttons.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={handleRequest} disabled={!canConfirm || isRequesting}>
            {isRequesting ? (
              <>
                {t("ui.buttons.deleting")}
                <LoaderCircleIcon className="animate-spin-slow h-5 w-5" />
              </>
            ) : (
              t("accountDeletion.admin.confirm")
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Header action on the user detail page: starts the same 7-day deletion request
 * the user can make, on their behalf. Platform administrators only, and only in
 * apps that registered AccountDeletionModule.
 */
export function AccountDeletionAdminTrigger({ user }: AccountDeletionAdminTriggerProps) {
  const { hasRole } = useCurrentUserContext<UserInterface>();

  if (!hasRole(getRoleId().Administrator) || !isAccountDeletionEnabled()) return null;

  return <AccountDeletionAdminTriggerInternal user={user} />;
}
