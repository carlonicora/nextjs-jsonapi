"use client";

// Exported from the Stripe-free `components` entry, because the banner mounts on
// every page. Keep every import here (and everything they import) free of `@stripe/*`.

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../../../../shadcnui/ui/alert";
import { Button } from "../../../../shadcnui/ui/button";
import { Link } from "../../../../shadcnui/custom/link";
import { CompanyService } from "../../../company/data/company.service";
import { useCurrentUserContext } from "../../../user/contexts/CurrentUserContext";
import { isCreditWarningActive } from "../../data/credit-warning";

export type CreditWarningBannerProps = {
  /** Only company administrators see the banner and can dismiss it. */
  canManageBilling: boolean;
  /** Must match the API's `billing.creditWarning.thresholdPercent`. Defaults to 80. */
  thresholdPercent?: number;
  changePlanHref?: string;
  buyCreditsHref?: string;
};

/**
 * Shown once per billing period when the credits left fall to `100 - thresholdPercent`
 * percent of this period's grant. Hidden at 0 credits, where the app's out-of-credits
 * banner takes over. The offer the server picked decides which links show.
 */
export function CreditWarningBanner({
  canManageBilling,
  thresholdPercent = 80,
  changePlanHref = "/settings/billing?action=change-plan",
  buyCreditsHref = "/settings/billing?action=subscribe",
}: CreditWarningBannerProps) {
  const t = useTranslations();
  // `company` is the live one, with the `company:credits_updated` balances applied.
  const { company, refreshUser } = useCurrentUserContext();
  const [dismissing, setDismissing] = useState(false);

  // Checked after every hook, so the hook count never changes between renders.
  if (!company || !canManageBilling || !isCreditWarningActive(company, thresholdPercent)) return null;

  const offer = company.creditWarningOffer;

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await CompanyService.dismissCreditWarning({ companyId: company.id });
      await refreshUser({ skipCookieUpdate: true });
    } finally {
      setDismissing(false);
    }
  };

  return (
    <Alert className="mb-4">
      <AlertTitle>{t("billing.ui.credit_warning.title", { percent: thresholdPercent })}</AlertTitle>
      <AlertDescription>
        <p>{t("billing.ui.credit_warning.body")}</p>
        {/* Never underlined: colour and weight carry the affordance. */}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          {offer === "subscribe" && (
            <Link href={changePlanHref} className="text-primary font-medium">
              {t("billing.ui.credit_warning.subscribe")}
            </Link>
          )}
          {offer === "upgrade-or-pack" && (
            <Link href={changePlanHref} className="text-primary font-medium">
              {t("billing.ui.credit_warning.upgrade")}
            </Link>
          )}
          {(offer === "upgrade-or-pack" || offer === "pack") && (
            <Link href={buyCreditsHref} className="text-primary font-medium">
              {t("billing.ui.credit_warning.add_pack")}
            </Link>
          )}
        </div>
      </AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t("billing.ui.credit_warning.dismiss")}
          disabled={dismissing}
          onClick={handleDismiss}
        >
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  );
}
