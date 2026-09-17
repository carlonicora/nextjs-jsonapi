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
import HowToReindexButton from "../forms/HowToReindexButton";

type HowToListProps = {
  fullWidth?: boolean;
  /** App-specific actions rendered before the built-in list actions */
  extraFunctions?: ReactNode[];
};

export default function HowToList({ fullWidth, extraFunctions }: HowToListProps) {
  const t = useTranslations();

  const data: DataListRetriever<HowToInterface> = useDataListRetriever({
    module: Modules.HowTo,
    retriever: (params) => HowToService.findMany(params),
    retrieverParams: {},
  });

  const functions: ReactNode[] = [
    ...(extraFunctions ?? []),
    <HowToReindexButton key="reindex-how-tos" refresh={data.refresh} />,
    <HowToEditor key="create-how-to" />,
  ];

  return (
    <ContentListTable
      data={data}
      fields={[HowToFields.name, HowToFields.pages]}
      tableGeneratorType={Modules.HowTo}
      functions={functions}
      title={t(`entities.howtos`, { count: 2 })}
      fullWidth={fullWidth}
    />
  );
}
