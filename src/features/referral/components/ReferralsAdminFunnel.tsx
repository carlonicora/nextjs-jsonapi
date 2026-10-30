"use client";

import { useTranslations } from "next-intl";
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import { SEQUENTIAL_RAMP } from "../../tokenusage/lib/palette";
import { ReferralAdminSummaryInterface } from "../interfaces/referral-admin.interface";

type Props = {
  summary: ReferralAdminSummaryInterface[];
};

/**
 * "From visit to paying": visits → invites → sign-ups → paying of the current
 * window as plain proportional bars, each with its share of the previous step.
 * Bars are scaled to the largest step, since invites can outnumber visits.
 * The rows copy TokenUsageRankedBar: same track, ramp, sizes and columns.
 */
export function ReferralsAdminFunnel({ summary }: Props) {
  const t = useTranslations();
  const { decimal } = useUsageFormatters();

  const current = summary.find((row) => row.window === "current");

  const steps = [
    { label: t("referral.admin.tiles.visits"), value: current?.visits ?? 0 },
    { label: t("referral.admin.tiles.invites"), value: current?.invitesSent ?? 0 },
    { label: t("referral.admin.tiles.signups"), value: current?.signups ?? 0 },
    { label: t("referral.admin.tiles.paying"), value: current?.paying ?? 0 },
  ];

  const max = Math.max(...steps.map((step) => step.value), 0);

  return (
    <section data-testid="referrals-funnel" className="grid gap-2">
      <h2 className="text-muted-foreground flex items-center gap-x-2 text-sm font-light whitespace-nowrap">
        {t("referral.admin.funnel.title")}
      </h2>
      <div className="grid gap-0.5">
        {steps.map((step, index) => {
          const width = max > 0 ? (step.value / max) * 100 : 0;
          const before = index > 0 ? steps[index - 1].value : undefined;
          const share =
            before === undefined ? "" : before ? `${decimal(Math.round((step.value / before) * 100), 0)}%` : "—";
          return (
            <div
              key={step.label}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-0.5 py-0.5"
            >
              <div className="grid min-w-0 gap-0.5">
                <span className="text-muted-foreground truncate text-xs">{step.label}</span>
                {/* The bar is a magnitude drawn on an axis, not prose: it always grows
                    rightward and only its trailing corner is rounded, so the track and its fill
                    stay an LTR island. The label, value and share around it mirror normally.
                    rtl-ok: deliberate LTR island (chart) */}
                <div className="bg-muted h-2 w-full overflow-hidden rounded-r-[4px]" dir="ltr">
                  <div
                    /* rtl-ok: inside the LTR island above */
                    className="h-full rounded-r-[4px]"
                    style={{
                      width: `${width}%`,
                      backgroundColor: SEQUENTIAL_RAMP[Math.min(index, SEQUENTIAL_RAMP.length - 1)],
                    }}
                  />
                </div>
              </div>
              <span className="text-end text-xs tabular-nums">{decimal(step.value, 0)}</span>
              <span className="text-muted-foreground w-16 text-end text-xs tabular-nums">{share}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
