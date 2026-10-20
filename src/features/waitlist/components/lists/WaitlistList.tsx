"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentListTable, errorToast } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { WaitlistFields } from "../../data/waitlist.fields";
import { WaitlistInterface } from "../../data/WaitlistInterface";
import { WaitlistService } from "../../data/WaitlistService";
import { WaitlistStatsInterface } from "../../data/waitlist-stats.interface";

type WaitlistListProps = {
  /**
   * Pass this whenever the list is the page's own content inside a
   * `RoundPageContainer fullWidth`. Without it ContentListTable wraps itself in
   * `rounded-md border`, drawing a second bordered card inside the page's
   * rounded shell.
   */
  fullWidth?: boolean;
};

export function WaitlistList({ fullWidth }: WaitlistListProps = {}) {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState<WaitlistStatsInterface | undefined>(undefined);

  const data: DataListRetriever<WaitlistInterface> = useDataListRetriever({
    retriever: (params) => WaitlistService.findMany(params),
    retrieverParams: {},
    module: Modules.Waitlist,
  });

  const loadStats = useCallback(async () => {
    try {
      setStats(await WaitlistService.getStats());
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    }
  }, [t]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const refresh = () => {
    void data.refresh();
    void loadStats();
  };

  const handleInvite = async (entry: WaitlistInterface) => {
    try {
      await WaitlistService.invite(entry.id);
      showToast(t("waitlist.admin.invite_sent", { email: entry.email }));
      refresh();
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    }
  };

  const handleStatusChange = (value: string | null) => {
    const status = value ?? "all";
    setStatusFilter(status);
    data.addAdditionalParameter("status", status === "all" ? null : status);
  };

  const statusItems = useMemo(
    () => ({
      all: t("waitlist.admin.all_statuses"),
      pending: t("waitlist.admin.status.pending"),
      confirmed: t("waitlist.admin.status.confirmed"),
      invited: t("waitlist.admin.status.invited"),
      registered: t("waitlist.admin.status.registered"),
    }),
    [t],
  );

  const filters = (
    <div className="flex items-center gap-4">
      <Select items={statusItems} value={statusFilter} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t("waitlist.admin.filter_placeholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("waitlist.admin.all_statuses")}</SelectItem>
          <SelectItem value="pending">{t("waitlist.admin.status.pending")}</SelectItem>
          <SelectItem value="confirmed">{t("waitlist.admin.status.confirmed")}</SelectItem>
          <SelectItem value="invited">{t("waitlist.admin.status.invited")}</SelectItem>
          <SelectItem value="registered">{t("waitlist.admin.status.registered")}</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={refresh} disabled={!data.isLoaded}>
        <RefreshCw className={`h-4 w-4 ${!data.isLoaded ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );

  const totals = [
    { key: "total", label: t("waitlist.admin.total"), value: stats?.total },
    { key: "pending", label: t("waitlist.admin.status.pending"), value: stats?.pending },
    { key: "confirmed", label: t("waitlist.admin.status.confirmed"), value: stats?.confirmed },
    { key: "invited", label: t("waitlist.admin.status.invited"), value: stats?.invited },
    { key: "registered", label: t("waitlist.admin.status.registered"), value: stats?.registered },
  ];

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-5 divide-x divide-border rounded-md border" data-testid="waitlist-totals">
        {totals.map((total) => (
          <div key={total.key} className="flex flex-col-reverse items-center gap-1 p-3">
            <dt className="text-muted-foreground text-xs">{total.label}</dt>
            <dd className="text-primary text-xl font-semibold tabular-nums">{total.value ?? "-"}</dd>
          </div>
        ))}
      </dl>
      <ContentListTable
        data={data}
        fields={[
          WaitlistFields.email,
          WaitlistFields.status,
          WaitlistFields.createdAt,
          WaitlistFields.source,
          WaitlistFields.questionnaire,
          WaitlistFields.actions,
        ]}
        tableGeneratorType={Modules.Waitlist}
        title={t("waitlist.admin.title")}
        filters={filters}
        /* The waitlist endpoint takes no search term, so rendering the box would
           give the page a control that silently does nothing. */
        allowSearch={false}
        context={{ onInvite: handleInvite }}
        fullWidth={fullWidth}
        emptyState={t("waitlist.admin.empty")}
      />
    </div>
  );
}
