"use client";

import { Modules } from "../../../../";
import { ContentTitle } from "../../../../components";
import { useSharedContext } from "../../../../contexts";
import { usePageUrlGenerator } from "../../../../hooks";
import { useCompanyContext } from "../../contexts/CompanyContext";
import { CompanyContent } from "./CompanyContent";
import { TokenStatusIndicator } from "./TokenStatusIndicator";

export function CompanyDetails() {
  const { title } = useSharedContext();
  const _generateUrl = usePageUrlGenerator();

  const { company } = useCompanyContext();
  if (!company) return null;

  return (
    <div className="flex w-full flex-col gap-y-2">
      <ContentTitle module={Modules.Company} type={title.type} element={title.element} functions={title.functions} />
      <TokenStatusIndicator size="md" />
      <CompanyContent company={company} />
    </div>
  );
}
