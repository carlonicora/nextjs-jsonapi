"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Modules } from "../../../../";
import { ContentTitle } from "../../../../components";
import { useSharedContext } from "../../../../contexts";
import { usePageUrlGenerator } from "../../../../hooks";
import { useCompanyContext } from "../../contexts/CompanyContext";
import { TokenStatusIndicator } from "./TokenStatusIndicator";

export function CompanyDetails() {
  const t = useTranslations();
  const { title } = useSharedContext();
  const _generateUrl = usePageUrlGenerator();

  const { company } = useCompanyContext();
  if (!company) return null;

  return (
    <div className="flex w-full flex-col gap-y-2">
      <ContentTitle module={Modules.Company} type={title.type} element={title.element} functions={title.functions} />
      {company.logo && (
        <Image src={company.logo} alt={company.name} width={150} height={150} className="mb-4 rounded-md" />
      )}
      <TokenStatusIndicator size="md" />
      <div className="flex flex-col gap-y-1">
        {company.configurations?.country && (
          <div className="text-muted-foreground text-sm">
            <span className="font-medium">{t("features.configuration.country")}:</span> {company.configurations.country}
          </div>
        )}
        {company.configurations?.currency && (
          <div className="text-muted-foreground text-sm">
            <span className="font-medium">{t("features.configuration.currency")}:</span>{" "}
            {company.configurations.currency}
          </div>
        )}
      </div>
    </div>
  );
}
