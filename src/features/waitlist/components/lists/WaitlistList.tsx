"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ContentListTable, errorToast } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { WaitlistFields } from "../../data/waitlist.fields";
import { WaitlistInterface } from "../../data/WaitlistInterface";
import { WaitlistService } from "../../data/WaitlistService";

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

  const data: DataListRetriever<WaitlistInterface> = useDataListRetriever({
    retriever: (params) => WaitlistService.findMany(params),
    retrieverParams: {},
    module: Modules.Waitlist,
  });

  const handleInvite = async (entry: WaitlistInterface) => {
    try {
      await WaitlistService.invite(entry.id);
      showToast(t("waitlist.admin.invite_sent", { email: entry.email }));
      void data.refresh();
    } catch (error) {
      errorToast({ error });
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

      <Button variant="outline" size="icon" onClick={() => void data.refresh()} disabled={!data.isLoaded}>
        <RefreshCw className={`h-4 w-4 ${!data.isLoaded ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );

  return (
    <ContentListTable
      data={data}
      fields={[
        WaitlistFields.email,
        WaitlistFields.status,
        WaitlistFields.createdAt,
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
  );
}
