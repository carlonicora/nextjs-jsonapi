"use client";

import HowToEditor from "@/features/essentials/how-to/components/forms/HowToEditor";
import { HowToFields } from "@/features/essentials/how-to/data/HowToFields";
import { HowToInterface } from "@/features/essentials/how-to/data/HowToInterface";
import { HowToService } from "@/features/essentials/how-to/data/HowToService";
import "@/features/essentials/how-to/hooks/useHowToTableStructure";
import { ContentListTable } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { DataListRetriever, useDataListRetriever } from "@carlonicora/nextjs-jsonapi/client";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

export default function HowToList() {
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
      fields={[HowToFields.name, HowToFields.author, HowToFields.updatedAt]}
      tableGeneratorType={Modules.HowTo}
      functions={functions}
      title={t(`entities.howtos`, { count: 2 })}
    />
  );
}
