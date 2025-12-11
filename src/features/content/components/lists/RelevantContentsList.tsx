"use client";

import { useTranslations } from "next-intl";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { ContentFields, ContentInterface, ContentService } from "../../data";

type RelevantContentsListProps = {
  id: string;
};

export function RelevantContentsList({ id }: RelevantContentsListProps) {
  const t = useTranslations();

  const data: DataListRetriever<ContentInterface> = useDataListRetriever({
    module: Modules.Content,
    retriever: (params) => ContentService.findRelevant(params),
    retrieverParams: { id: id },
  });

  return (
    <ContentListTable
      data={data}
      fields={[ContentFields.name, ContentFields.authors, ContentFields.relevance, ContentFields.updatedAt]}
      tableGeneratorType={Modules.Content}
      title={t(`generic.relevant`)}
    />
  );
}
