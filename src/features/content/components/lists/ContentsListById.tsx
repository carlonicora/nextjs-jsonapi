"use client";

import { useTranslations } from "next-intl";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { ContentFields, ContentInterface, ContentService } from "../../data";

type ContentsListByIdProps = {
  contentIds: string[];
};

export function ContentsListById({ contentIds }: ContentsListByIdProps) {
  const t = useTranslations();

  const data: DataListRetriever<ContentInterface> = useDataListRetriever({
    module: Modules.Content,
    retriever: (params) => ContentService.findMany(params),
    retrieverParams: { contentIds: contentIds },
  });

  return (
    <ContentListTable
      data={data}
      fields={[ContentFields.name, ContentFields.authors, ContentFields.updatedAt]}
      tableGeneratorType={Modules.Content}
      title={t(`generic.relevant`)}
    />
  );
}
