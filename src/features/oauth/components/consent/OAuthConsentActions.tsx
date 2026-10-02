"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../../../shadcnui";

export interface OAuthConsentActionsProps {
  /** Called when user clicks Authorize */
  onApprove: () => void;
  /** Called when user clicks Deny */
  onDeny: () => void;
  /** Whether an action is in progress */
  isLoading?: boolean;
}

/**
 * Action buttons for OAuth consent screen
 */
export function OAuthConsentActions({ onApprove, onDeny, isLoading = false }: OAuthConsentActionsProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button variant="outline" onClick={onDeny} disabled={isLoading} className="flex-1">
        {t("oauth.consent.deny")}
      </Button>
      <Button onClick={onApprove} disabled={isLoading} className="flex-1">
        {isLoading ? t("oauth.consent.authorizing") : t("oauth.consent.authorize")}
      </Button>
    </div>
  );
}
