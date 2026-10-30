"use client";

import { CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { ContentListTable, RoundPageContainer } from "../../../../components";
import { SharedProvider } from "../../../../contexts/SharedContext";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { BreadcrumbItemData } from "../../../../interfaces";
import { Button } from "../../../../shadcnui";
import { ReferralAdminService } from "../../data/ReferralAdminService";
// Importing the field enums (runtime values) also runs the hook modules, which
// is what registers the table generators ContentListTable looks up.
import { ReferralAdminReferralFields } from "../../hooks/useReferralAdminReferralTableStructure";
import {
  copyReferrerEmails,
  ReferralAdminReferrerFields,
  ReferralAdminReferrerTableContext,
} from "../../hooks/useReferralAdminReferrerTableStructure";
import {
  ReferralAdminPeriod,
  ReferralAdminReferralInterface,
  ReferralAdminReferrerInterface,
  ReferralAdminSort,
  ReferralAdminSummaryInterface,
} from "../../interfaces/referral-admin.interface";
import { ReferralsAdminFunnel } from "../ReferralsAdminFunnel";
import { ReferralsAdminTiles } from "../ReferralsAdminTiles";

const PERIODS: ReferralAdminPeriod[] = ["30d", "90d", "all"];

const REFERRER_FIELDS = [
  ReferralAdminReferrerFields.rank,
  ReferralAdminReferrerFields.referrer,
  ReferralAdminReferrerFields.visits,
  ReferralAdminReferrerFields.invites,
  ReferralAdminReferrerFields.signups,
  ReferralAdminReferrerFields.paying,
  ReferralAdminReferrerFields.conversion,
  ReferralAdminReferrerFields.credits,
  ReferralAdminReferrerFields.lastInvite,
];

const REFERRAL_FIELDS = [
  ReferralAdminReferralFields.account,
  ReferralAdminReferralFields.referrer,
  ReferralAdminReferralFields.source,
  ReferralAdminReferralFields.date,
  ReferralAdminReferralFields.status,
  ReferralAdminReferralFields.credits,
];

/**
 * Pushes a changed parameter into a list retriever. The retriever reads its
 * `retrieverParams` only on the first load; a later change goes through
 * `addAdditionalParameter`, which re-fetches and keeps the old rows on screen
 * until the new ones arrive. The first render is skipped: the initial load
 * already carries the value.
 */
function useRefetchOnChange(retriever: DataListRetriever<unknown>, key: string, value: string) {
  const previous = useRef(value);
  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    retriever.addAdditionalParameter(key, value);
  }, [retriever, key, value]);
}

/**
 * Administrative referral report: period buttons in the title bar, the KPI
 * tiles, the visit-to-paying funnel, the referrers ranking and every referral.
 * Client component by necessity: `module={Modules.ReferralAdminSummary}` is a
 * registry entry carrying an icon component, which a Server Component cannot
 * pass across the boundary.
 */
export function ReferralsAdminContainer() {
  const t = useTranslations();
  const [period, setPeriod] = useState<ReferralAdminPeriod>("30d");
  const [sort, setSort] = useState<ReferralAdminSort>("paying");
  const [summary, setSummary] = useState<ReferralAdminSummaryInterface[]>([]);

  useEffect(() => {
    let cancelled = false;
    ReferralAdminService.getSummary({ period })
      .then((rows) => {
        if (!cancelled) setSummary(rows ?? []);
      })
      .catch(() => {
        if (!cancelled) setSummary([]);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const referrers: DataListRetriever<ReferralAdminReferrerInterface> = useDataListRetriever({
    module: Modules.ReferralAdminReferrer,
    retriever: (params: { period: ReferralAdminPeriod; sort: ReferralAdminSort }) =>
      ReferralAdminService.getReferrers({ period: params.period, sort: params.sort }),
    retrieverParams: { period, sort },
  });

  const referrals: DataListRetriever<ReferralAdminReferralInterface> = useDataListRetriever({
    module: Modules.ReferralAdminReferral,
    retriever: (params: { period: ReferralAdminPeriod }) =>
      ReferralAdminService.getReferrals({ period: params.period }),
    retrieverParams: { period },
  });

  useRefetchOnChange(referrers as DataListRetriever<unknown>, "period", period);
  useRefetchOnChange(referrers as DataListRetriever<unknown>, "sort", sort);
  useRefetchOnChange(referrals as DataListRetriever<unknown>, "period", period);

  const referrerContext = useMemo<ReferralAdminReferrerTableContext>(() => ({ sort, onSort: setSort }), [sort]);

  const periodLabels: Record<ReferralAdminPeriod, string> = {
    "30d": t("referral.admin.period.30d"),
    "90d": t("referral.admin.period.90d"),
    all: t("referral.admin.period.all"),
  };

  const periodButtons = (
    <div
      key="referralsAdminPeriod"
      role="group"
      className="border-border inline-flex items-center gap-0.5 rounded-md border p-0.5"
    >
      {PERIODS.map((value) => {
        const selected = value === period;
        return (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={selected ? "default" : "ghost"}
            aria-pressed={selected}
            data-testid={`referrals-period-${value}`}
            onClick={() => setPeriod(value)}
          >
            {periodLabels[value]}
          </Button>
        );
      })}
    </div>
  );

  const shownEmails = (referrers.data ?? []).map((entry) => entry.email).filter((email) => !!email);

  const copyAll = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-testid="referrals-copy-all-emails"
      disabled={shownEmails.length === 0}
      onClick={() => copyReferrerEmails(shownEmails.join(", "), t)}
    >
      <CopyIcon />
      {t("referral.admin.referrers.copyAll")}
    </Button>
  );

  const breadcrumbs: BreadcrumbItemData[] = [{ name: t("referral.admin.title") }];

  return (
    <SharedProvider value={{ breadcrumbs, title: { type: t("referral.admin.title"), functions: periodButtons } }}>
      <RoundPageContainer module={Modules.ReferralAdminSummary} fullWidth forceHeader testId="page-admin-referrals">
        <div className="flex w-full flex-col gap-6 p-4">
          <p className="text-muted-foreground text-xs">{t("referral.admin.description")}</p>

          <ReferralsAdminTiles summary={summary} />

          <ReferralsAdminFunnel summary={summary} />

          <section data-testid="referrals-referrers">
            <ContentListTable
              data={referrers}
              fields={REFERRER_FIELDS}
              tableGeneratorType={Modules.ReferralAdminReferrer}
              context={referrerContext}
              title={t("referral.admin.referrers.title")}
              titleActions={copyAll}
              hidePagination
              allowSearch={false}
              emptyState={t("referral.admin.referrers.empty")}
            />
          </section>

          <section data-testid="referrals-referrals">
            <ContentListTable
              data={referrals}
              fields={REFERRAL_FIELDS}
              tableGeneratorType={Modules.ReferralAdminReferral}
              title={t("referral.admin.referrals.title")}
              hidePagination
              allowSearch={false}
              emptyState={t("referral.admin.referrals.empty")}
            />
          </section>
        </div>
      </RoundPageContainer>
    </SharedProvider>
  );
}
