"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { v4 } from "uuid";
import { errorToast } from "../../../../components";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { PasskeyInterface } from "../../data/passkey.interface";
import { TotpAuthenticatorInterface } from "../../data/totp-authenticator.interface";
import { TwoFactorStatusInterface } from "../../data/two-factor-status.interface";
import { TwoFactorService } from "../../data/two-factor.service";
import { BackupCodesDialog } from "./BackupCodesDialog";
import { DisableTwoFactorDialog } from "./DisableTwoFactorDialog";
import { PasskeyList } from "./PasskeyList";
import { PasskeySetupDialog } from "./PasskeySetupDialog";
import { TotpAuthenticatorList } from "./TotpAuthenticatorList";
import { TotpSetupDialog } from "./TotpSetupDialog";

export function TwoFactorSettings() {
  const t = useTranslations();
  const [status, setStatus] = useState<TwoFactorStatusInterface | null>(null);
  const [authenticators, setAuthenticators] = useState<TotpAuthenticatorInterface[]>([]);
  const [passkeys, setPasskeys] = useState<PasskeyInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [passkeyDialogOpen, setPasskeyDialogOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      // Load status and lists in parallel
      const [statusData, authenticatorsList, passkeysList] = await Promise.all([
        TwoFactorService.getStatus(),
        TwoFactorService.listTotpAuthenticators(),
        TwoFactorService.listPasskeys(),
      ]);
      setStatus(statusData);
      setAuthenticators(authenticatorsList);
      setPasskeys(passkeysList);
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRefresh = () => {
    loadStatus();
  };

  const handleEnable2FA = async () => {
    setIsEnabling(true);
    try {
      const preferredMethod = authenticators.length > 0 ? "totp" : "passkey";
      await TwoFactorService.enable({ id: v4(), preferredMethod });
      showToast(t("common.success"), { description: t("auth.two_factor.enabled_success") });
      await loadStatus();
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setIsEnabling(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </CardContent>
      </Card>
    );
  }

  const isEnabled = status?.isEnabled ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {isEnabled ? (
            <ShieldCheck className="h-6 w-6 text-green-600" />
          ) : (
            <ShieldAlert className="h-6 w-6 text-yellow-600" />
          )}
          <div>
            <CardTitle>{t("auth.two_factor.title")}</CardTitle>
            <CardDescription>
              {isEnabled ? t("auth.two_factor.enabled_description") : t("auth.two_factor.disabled_description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Authenticator Apps Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t("auth.two_factor.authenticator_apps")}</h3>
              <p className="text-sm text-muted-foreground">{t("auth.two_factor.authenticator_apps_description")}</p>
            </div>
            <TotpSetupDialog onSuccess={handleRefresh} />
          </div>
          <TotpAuthenticatorList authenticators={authenticators} onDelete={handleRefresh} />
        </div>

        <Separator />

        {/* Passkeys Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t("auth.two_factor.passkeys")}</h3>
              <p className="text-sm text-muted-foreground">{t("auth.two_factor.passkeys_description")}</p>
            </div>
            <Button variant="outline" onClick={() => setPasskeyDialogOpen(true)}>
              {t("auth.two_factor.add_passkey")}
            </Button>
          </div>
          <PasskeyList passkeys={passkeys} onRefresh={handleRefresh} />
        </div>

        <PasskeySetupDialog open={passkeyDialogOpen} onOpenChange={setPasskeyDialogOpen} onSuccess={handleRefresh} />

        <Separator />

        {/* Backup Codes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t("auth.two_factor.backup_codes")}</h3>
              <p className="text-sm text-muted-foreground">{t("auth.two_factor.backup_codes_description")}</p>
            </div>
            <BackupCodesDialog remainingCodes={status?.backupCodesCount ?? 0} onRegenerate={handleRefresh} />
          </div>
        </div>

        {/* Enable 2FA - shown when not enabled but methods exist */}
        {!isEnabled && (authenticators.length > 0 || passkeys.length > 0) && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-600">{t("auth.two_factor.enable_2fa")}</h3>
                <p className="text-sm text-muted-foreground">{t("auth.two_factor.enable_description")}</p>
              </div>
              <Button onClick={handleEnable2FA} disabled={isEnabling}>
                {isEnabling ? t("common.loading") : t("auth.two_factor.enable_button")}
              </Button>
            </div>
          </>
        )}

        {/* Disable 2FA */}
        {isEnabled && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-destructive">{t("auth.two_factor.disable_2fa")}</h3>
                <p className="text-sm text-muted-foreground">{t("auth.two_factor.disable_warning")}</p>
              </div>
              <DisableTwoFactorDialog onSuccess={handleRefresh} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
