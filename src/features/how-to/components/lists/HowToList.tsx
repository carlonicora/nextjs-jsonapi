"use client";

import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { HowToFields } from "../../data/HowToFields";
import { HowToInterface } from "../../data/HowToInterface";
import { HowToService } from "../../data/HowToService";
import "../../hooks/useHowToTableStructure";
import HowToEditor from "../forms/HowToEditor";

type HowToListProps = {
  fullWidth?: boolean;
};

export default function HowToList({ fullWidth }: HowToListProps) {
  const t = useTranslations();

  const data: DataListRetriever<HowToInterface> = useDataListRetriever({
    module: Modules.HowTo,
    retriever: (params) => HowToService.findMany(params),
    retrieverParams: {},
  });

  const functions: ReactNode[] = [<HowToEditor key="create-how-to" />];

  return (
    <ContentListTable
      data={data}
      fields={[HowToFields.name, HowToFields.pages, HowToFields.updatedAt]}
      tableGeneratorType={Modules.HowTo}
      functions={functions}
      title={t(`entities.howtos`, { count: 2 })}
      fullWidth={fullWidth}
    />
  );
}
