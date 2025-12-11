"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { ContentTitle } from "../../../../components";
import { useSharedContext } from "../../../../contexts";
import { usePageUrlGenerator } from "../../../../hooks";
import { useCompanyContext } from "../../contexts/CompanyContext";

export function CompanyDetails() {
  const t = useTranslations();
  const { title } = useSharedContext();
  const generateUrl = usePageUrlGenerator();

  const { company } = useCompanyContext();
  if (!company) return null;

  return (
    <div className="flex w-full flex-col gap-y-2">
      <ContentTitle type={title.type} element={title.element} functions={title.functions} />
      {company.logo && (
        <Image src={company.logo} alt={company.name} width={150} height={150} className="mb-4 rounded-md" />
      )}
    </div>
  );
}
