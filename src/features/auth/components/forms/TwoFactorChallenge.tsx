"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { v4 } from "uuid";
import { errorToast } from "../../../../components";
import { useI18nRouter, usePageUrlGenerator } from "../../../../hooks";
import {
  Button,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../shadcnui";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { useAuthContext } from "../../contexts";
import { AuthInterface } from "../../data/auth.interface";
import { TwoFactorService } from "../../data/two-factor.service";
import { PasskeyButton } from "../two-factor/PasskeyButton";
import { TotpInput } from "../two-factor/TotpInput";

export function TwoFactorChallenge() {
  const t = useTranslations();
  const { setUser } = useCurrentUserContext<UserInterface>();
  const { pendingTwoFactor, setPendingTwoFactor } = useAuthContext();
  const generateUrl = usePageUrlGenerator();
  const i18nRouter = useI18nRouter();
  const nativeRouter = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [isVerifying, setIsVerifying] = useState(false);
  const [totpError, setTotpError] = useState<string | undefined>();
  const [backupCode, setBackupCode] = useState("");
  const [backupError, setBackupError] = useState<string | undefined>();

  if (!pendingTwoFactor) {
    return null;
  }

  const handleSuccess = (auth: AuthInterface) => {
    setPendingTwoFactor(undefined);
    setUser(auth.user);

    if (callbackUrl) {
      nativeRouter.replace(callbackUrl);
    } else {
      i18nRouter.replace(generateUrl({ page: "/" }));
    }
  };

  const handleTotpComplete = async (code: string) => {
    setIsVerifying(true);
    setTotpError(undefined);

    try {
      const auth = await TwoFactorService.verifyTotp({
        id: v4(),
        pendingToken: pendingTwoFactor.pendingToken,
        code,
      });
      handleSuccess(auth);
    } catch (error) {
      setTotpError(t("auth.two_factor.invalid_code"));
      errorToast({
        title: t("common.errors.error"),
        error,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasskeyError = (error: Error) => {
    errorToast({
      title: t("common.errors.error"),
      error,
    });
  };

  const handleBackupSubmit = async () => {
    if (backupCode.length < 8) {
      setBackupError(t("auth.two_factor.invalid_backup_code"));
      return;
    }

    setIsVerifying(true);
    setBackupError(undefined);

    try {
      const auth = await TwoFactorService.verifyBackupCode({
        id: v4(),
        pendingToken: pendingTwoFactor.pendingToken,
        code: backupCode,
      });
      handleSuccess(auth);
    } catch (error) {
      setBackupError(t("auth.two_factor.invalid_backup_code"));
      errorToast({
        title: t("common.errors.error"),
        error,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const availableMethods = pendingTwoFactor.availableMethods;
  const hasTotp = availableMethods.includes("totp");
  const hasPasskey = availableMethods.includes("passkey");
  const hasBackup = availableMethods.includes("backup");

  return (
    <>
      <CardHeader data-testid="page-2fa-challenge">
        <CardTitle className="text-primary text-2xl">{t("auth.two_factor.verification_required")}</CardTitle>
        <CardDescription>{t("auth.two_factor.enter_verification_code")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={hasTotp ? "totp" : hasPasskey ? "passkey" : "backup"}>
          <TabsList className="grid w-full grid-cols-3">
            {hasTotp && (
              <TabsTrigger value="totp" data-testid="tab-totp">
                {t("auth.two_factor.authenticator")}
              </TabsTrigger>
            )}
            {hasPasskey && (
              <TabsTrigger value="passkey" data-testid="tab-passkey">
                {t("auth.two_factor.passkey")}
              </TabsTrigger>
            )}
            {hasBackup && (
              <TabsTrigger value="backup" data-testid="tab-backup">
                {t("auth.two_factor.backup_code")}
              </TabsTrigger>
            )}
          </TabsList>

          {hasTotp && (
            <TabsContent value="totp" className="mt-6">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  {t("auth.two_factor.enter_authenticator_code")}
                </p>
                <TotpInput onComplete={handleTotpComplete} disabled={isVerifying} error={totpError} />
              </div>
            </TabsContent>
          )}

          {hasPasskey && (
            <TabsContent value="passkey" className="mt-6">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  {t("auth.two_factor.use_passkey_description")}
                </p>
                <PasskeyButton
                  pendingToken={pendingTwoFactor.pendingToken}
                  onSuccess={handleSuccess}
                  onError={handlePasskeyError}
                  disabled={isVerifying}
                />
              </div>
            </TabsContent>
          )}

          {hasBackup && (
            <TabsContent value="backup" className="mt-6">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center">{t("auth.two_factor.enter_backup_code")}</p>
                <Input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  className={`w-48 text-center font-mono uppercase ${backupError ? "border-destructive" : ""}`}
                  disabled={isVerifying}
                  data-testid="backup-code-input"
                />
                {backupError && <p className="text-sm text-destructive">{backupError}</p>}
                <Button
                  onClick={handleBackupSubmit}
                  disabled={isVerifying || backupCode.length < 8}
                  data-testid="backup-code-submit"
                >
                  {t("auth.two_factor.verify")}
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </>
  );
}
