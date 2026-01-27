"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { v4 } from "uuid";
import { Button } from "../../../../shadcnui";
import { TwoFactorService } from "../../data/two-factor.service";
import { AuthInterface } from "../../data/auth.interface";

interface PasskeyButtonProps {
  pendingToken: string;
  onSuccess: (auth: AuthInterface) => void;
  onError: (error: Error) => void;
  disabled?: boolean;
}

export function PasskeyButton({ pendingToken, onSuccess, onError, disabled = false }: PasskeyButtonProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      // 1. Get authentication options from backend
      const { pendingId, options } = await TwoFactorService.getPasskeyAuthOptions({ pendingToken });

      // 2. Trigger browser WebAuthn dialog
      const credential = await startAuthentication({ optionsJSON: options });

      // 3. Verify with backend
      const auth = await TwoFactorService.verifyPasskey({
        id: v4(),
        pendingToken,
        pendingId,
        credential,
      });

      onSuccess(auth);
    } catch (error) {
      onError(error instanceof Error ? error : new Error("Passkey authentication failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="w-full"
      data-testid="passkey-auth-button"
    >
      {isLoading ? t("auth.two_factor.verifying") : t("auth.two_factor.use_passkey")}
    </Button>
  );
}
