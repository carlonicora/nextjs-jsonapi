"use client";

import { useTranslations } from "next-intl";
import { MicroLabel } from "../../../components/typography/MicroLabel";
import { Card, CardContent } from "../../../shadcnui";
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import { percentageDelta } from "../../tokenusage/lib/metrics";
import { ReferralAdminSummaryInterface } from "../interfaces/referral-admin.interface";

type Props = {
  /** The summary rows: `current`, plus `previous` unless the period is `all`. */
  summary: ReferralAdminSummaryInterface[];
};

type Metric =
  "visits" | "invitesSent" | "signups" | "paying" | "creditsGiven" | "sharingCompanies" | "eligibleCompanies";

const ZERO: Record<Metric, number> = {
  visits: 0,
  invitesSent: 0,
  signups: 0,
  paying: 0,
  creditsGiven: 0,
  sharingCompanies: 0,
  eligibleCompanies: 0,
};

/**
 * The KPI row of the administrative referral page. Each tile reads the
 * `current` window; the change line compares it with the `previous` one and is
 * left out when there is no previous window (the `all` period).
 */
export function ReferralsAdminTiles({ summary }: Props) {
  const t = useTranslations();
  const { decimal } = useUsageFormatters();

  const current = summary.find((row) => row.window === "current") ?? ZERO;
  const previous = summary.find((row) => row.window === "previous");

  const change = (metric: Metric): string | undefined => {
    if (!previous) return undefined;
    const delta = percentageDelta(current[metric], previous[metric]);
    const formatted = delta === undefined ? "—" : `${delta > 0 ? "+" : ""}${decimal(delta, 0)}%`;
    return t("referral.admin.tiles.change", { delta: formatted });
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,4fr)]">
      <LeadTile
        id="sharing"
        label={t("referral.admin.tiles.sharing")}
        value={decimal(current.sharingCompanies, 0)}
        detail={t("referral.admin.tiles.sharingOf", {
          count: decimal(current.sharingCompanies, 0),
          total: decimal(current.eligibleCompanies, 0),
        })}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SupportingTile
          id="visits"
          label={t("referral.admin.tiles.visits")}
          value={decimal(current.visits, 0)}
          change={change("visits")}
        />
        <SupportingTile
          id="invites"
          label={t("referral.admin.tiles.invites")}
          value={decimal(current.invitesSent, 0)}
          change={change("invitesSent")}
        />
        <SupportingTile
          id="signups"
          label={t("referral.admin.tiles.signups")}
          value={decimal(current.signups, 0)}
          change={change("signups")}
        />
        <SupportingTile
          id="paying"
          label={t("referral.admin.tiles.paying")}
          value={decimal(current.paying, 0)}
          change={change("paying")}
        />
        <SupportingTile
          id="credits"
          label={t("referral.admin.tiles.credits")}
          value={decimal(current.creditsGiven, 0)}
          change={change("creditsGiven")}
        />
      </div>
    </div>
  );
}

/** The lead tile: the same card and recipe as AnalyticsAdminTiles' LeadTile. */
function LeadTile({ id, label, value, detail }: { id: string; label: string; value: string; detail: string }) {
  return (
    <Card data-testid={`referrals-tile-${id}`}>
      <CardContent className="grid gap-1">
        <MicroLabel>{label}</MicroLabel>
        <span data-testid={`referrals-tile-${id}-value`} className="text-primary text-xl font-semibold tabular-nums">
          {value}
        </span>
        <span className="text-muted-foreground text-xs">{detail}</span>
      </CardContent>
    </Card>
  );
}

/** A supporting tile: the same card and recipe as AnalyticsAdminTiles' SupportingTile. */
function SupportingTile({ id, label, value, change }: { id: string; label: string; value: string; change?: string }) {
  return (
    <Card data-testid={`referrals-tile-${id}`} size="sm">
      <CardContent className="grid gap-1">
        <MicroLabel>{label}</MicroLabel>
        <span className="flex items-center gap-2">
          <span data-testid={`referrals-tile-${id}-value`} className="text-sm font-medium tabular-nums">
            {value}
          </span>
          {change && (
            <span data-testid={`referrals-tile-${id}-change`} className="text-muted-foreground text-xs">
              {change}
            </span>
          )}
        </span>
      </CardContent>
    </Card>
  );
}
