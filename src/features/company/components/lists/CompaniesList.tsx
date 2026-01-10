"use client";

import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { CompanyFields, CompanyInterface } from "../../data";
import { CompanyService } from "../../data/company.service";
import { CompanyEditor } from "../forms/CompanyEditor";

export function CompaniesList() {
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
      fields={[CompanyFields.name, CompanyFields.createdAt]}
      tableGeneratorType={Modules.Company}
      functions={functions}
      title={t(`entities.companies`, { count: 2 })}
    />
  );
}
