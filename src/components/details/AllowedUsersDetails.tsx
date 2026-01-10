"use client";

import { useTranslations } from "next-intl";
import { ContentInterface } from "../../features/content/data";
import { ContributorsList } from "../../features/user/components";

type AllowedUsersDetailsProps = {
  showTitle?: boolean;
  content: ContentInterface;
};

export function AllowedUsersDetails({ showTitle, content }: AllowedUsersDetailsProps) {
  const t = useTranslations();

  return (
    <div className="mb-2 flex w-full flex-col gap-y-2">
      {showTitle && <h3 className="text-xs font-semibold">{t("common.permissions")}</h3>}
      <div className="flex w-full items-center justify-start gap-x-4">
        <ContributorsList content={content} />
      </div>
    </div>
  );
}
