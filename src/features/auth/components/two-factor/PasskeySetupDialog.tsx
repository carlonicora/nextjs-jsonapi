"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { v4 } from "uuid";
import { errorToast } from "../../../../components/errors/errorToast";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { useCurrentUserContext } from "../../../user/contexts/CurrentUserContext";
import { TwoFactorService } from "../../data/two-factor.service";

interface PasskeySetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PasskeySetupDialog({ open, onOpenChange, onSuccess }: PasskeySetupDialogProps) {
  const t = useTranslations();
  const { currentUser } = useCurrentUserContext();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      // 1. Get registration options from backend
      const registrationData = await TwoFactorService.getPasskeyRegistrationOptions({
        id: v4(),
        userName: currentUser?.email ?? "",
        userDisplayName: currentUser?.name,
      });

      // 2. Trigger browser WebAuthn dialog
      const credential = await startRegistration({ optionsJSON: registrationData.options });

      // 3. Verify with backend
      await TwoFactorService.verifyPasskeyRegistration({
        id: v4(),
        pendingId: registrationData.pendingId,
        name: name.trim(),
        response: credential,
      });

      // Auto-enable 2FA if not already enabled
      const status = await TwoFactorService.getStatus();
      if (!status.isEnabled) {
        await TwoFactorService.enable({ id: v4(), preferredMethod: "passkey" });
      }

      showToast(t("common.success"), {
        description: t("auth.two_factor.passkey_registered"),
      });

      setName("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      errorToast({
        title: t("common.errors.error"),
        error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("auth.two_factor.setup_passkey")}</DialogTitle>
          <DialogDescription>{t("auth.two_factor.passkey_setup_description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passkey-name">{t("auth.two_factor.passkey_name")}</Label>
            <Input
              id="passkey-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MacBook Pro Touch ID"
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleRegister} disabled={!name.trim() || isLoading} className="w-full">
            {isLoading ? t("common.loading") : t("auth.two_factor.register_passkey")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
