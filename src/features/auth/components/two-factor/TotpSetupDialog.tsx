"use client";

import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
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
  DialogTrigger,
  Input,
  Label,
} from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { useCurrentUserContext } from "../../../user/contexts/CurrentUserContext";
import { TwoFactorService } from "../../data/two-factor.service";
import { TotpInput } from "./TotpInput";

interface TotpSetupDialogProps {
  onSuccess: () => void;
  trigger?: React.ReactElement;
}

export function TotpSetupDialog({ onSuccess, trigger }: TotpSetupDialogProps) {
  const t = useTranslations();
  const { currentUser } = useCurrentUserContext();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"name" | "scan" | "verify">("name");
  const [name, setName] = useState("");
  const [qrCodeUri, setQrCodeUri] = useState("");
  const [authenticatorId, setAuthenticatorId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | undefined>();

  const handleStartSetup = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const setup = await TwoFactorService.setupTotp({
        id: v4(),
        name: name.trim(),
        accountName: currentUser?.email ?? "",
      });

      setQrCodeUri(setup.qrCodeUri);
      setAuthenticatorId(setup.authenticatorId);
      setStep("scan");
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    setIsLoading(true);
    setVerifyError(undefined);

    try {
      await TwoFactorService.verifyTotpSetup({
        id: v4(),
        authenticatorId,
        code,
      });

      // Auto-enable 2FA if not already enabled
      const status = await TwoFactorService.getStatus();
      if (!status.isEnabled) {
        await TwoFactorService.enable({ id: v4(), preferredMethod: "totp" });
      }

      showToast(t("common.success"), {
        description: t("auth.two_factor.authenticator_added"),
      });

      setOpen(false);
      resetState();
      onSuccess();
    } catch (error) {
      setVerifyError(t("auth.two_factor.invalid_code"));
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep("name");
    setName("");
    setQrCodeUri("");
    setAuthenticatorId("");
    setVerifyError(undefined);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button variant="outline">{t("auth.two_factor.add_authenticator")}</Button>} />
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auth.two_factor.setup_authenticator")}</DialogTitle>
          <DialogDescription>
            {step === "name" && t("auth.two_factor.name_your_authenticator")}
            {step === "scan" && t("auth.two_factor.scan_qr_code")}
            {step === "verify" && t("auth.two_factor.enter_verification_code")}
          </DialogDescription>
        </DialogHeader>

        {step === "name" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="authenticator-name">{t("auth.two_factor.authenticator_name")}</Label>
              <Input
                id="authenticator-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.two_factor.authenticator_name_placeholder")}
                data-testid="authenticator-name-input"
              />
            </div>
            <Button onClick={handleStartSetup} disabled={!name.trim() || isLoading} data-testid="start-setup-button">
              {t("common.buttons.continue")}
            </Button>
          </div>
        )}

        {step === "scan" && (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG value={qrCodeUri} size={200} data-testid="totp-qr-code" />
            </div>
            <p className="text-sm text-muted-foreground text-center">{t("auth.two_factor.scan_with_app")}</p>
            <Button onClick={() => setStep("verify")} data-testid="next-to-verify">
              {t("common.buttons.next")}
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="flex flex-col items-center gap-4">
            <TotpInput onComplete={handleVerify} disabled={isLoading} error={verifyError} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
