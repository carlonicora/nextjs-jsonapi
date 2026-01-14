"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { showToast } from "../../../../utils/toast";
import { errorToast } from "../../../../components";
import { CardContent, CardDescription, CardHeader, CardTitle } from "../../../../shadcnui";
import { useAuthContext } from "../../contexts";
import { AuthService } from "../../data/auth.service";
import { AuthComponent } from "../../enums";

export function ActivateAccount() {
  const { setComponentType, params, setParams } = useAuthContext();
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const t = useTranslations();

  useEffect(() => {
    async function ActivateAccount(code: string) {
      try {
        const payload = {
          activationCode: code,
        };

        await AuthService.activate(payload);
        setShowConfirmation(true);

        setParams(undefined);

        showToast(t("auth.account_activated"), {
          description: t("auth.account_activated_description"),
        });

        setTimeout(() => {
          setComponentType(AuthComponent.Login);
        }, 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        errorToast({ title: t(`common.errors.error`), error: e });
      }
    }

    if (params && params.code) {
      ActivateAccount(params.code);
    } else {
      setError(t(`auth.errors.invalid_invitation_code`));
    }
  }, []);

  return (
    <>
      <CardHeader>
        <CardTitle className="text-primary flex flex-col items-center pb-10 text-4xl">
          <Image src="/logo.webp" alt="Logo" width={100} height={100} priority />
          {t("auth.accept_invitation")}
        </CardTitle>
        <CardDescription className="text-center text-sm">
          {error ? <>{t("auth.errors.activating_account")}</> : <> </>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-center text-xl">
          {showConfirmation ? (
            <>{t("auth.activation_description")}</>
          ) : error ? (
            <>{error}</>
          ) : (
            <>{t("auth.activation_wait")}</>
          )}
        </CardDescription>
      </CardContent>
    </>
  );
}
