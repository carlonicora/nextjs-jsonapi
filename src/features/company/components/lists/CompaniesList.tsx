"use client";

import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { CompanyFields, CompanyInterface } from "../../data";
import { CompanyService } from "../../data/company.service";
import { CompanyEditor } from "../forms/CompanyEditor";

type CompaniesListProps = {
  /**
   * Pass this whenever the list is the page's own content inside a
   * `RoundPageContainer fullWidth`. Without it ContentListTable wraps itself in
   * `rounded-md border`, drawing a second bordered card inside the page's
   * rounded shell — two borders fighting each other at every corner.
   */
  fullWidth?: boolean;
};

export function CompaniesList({ fullWidth }: CompaniesListProps = {}) {
  const t = useTranslations();

  const data: DataListRetriever<CompanyInterface> = useDataListRetriever({
    retriever: (params) => CompanyService.findMany(params),
    retrieverParams: {},
    module: Modules.Company,
  });

  const functions: ReactNode[] = [<CompanyEditor key="create-account" />];

  return (
    <ContentListTable
      data={data}
      fields={[CompanyFields.name]}
      tableGeneratorType={Modules.Company}
      functions={functions}
      fullWidth={fullWidth}
      title={t(`entities.companies`, { count: 2 })}
    />
  );
}
