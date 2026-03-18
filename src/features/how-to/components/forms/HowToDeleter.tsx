"use client";

import { useTranslations } from "next-intl";
import { CommonDeleter } from "../../../../components";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { HowToInterface } from "../../data/HowToInterface";
import { HowToService } from "../../data/HowToService";

type HowToDeleterProps = {
  howTo: HowToInterface;
};

function HowToDeleterInternal({ howTo }: HowToDeleterProps) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  if (!howTo) return null;

  return (
    <CommonDeleter
      type={`howtos`}
      deleteFunction={() => HowToService.delete({ howToId: howTo.id })}
      redirectTo={generateUrl({ page: Modules.HowTo })}
    />
  );
}

export default function HowToDeleter(props: HowToDeleterProps) {
  return <HowToDeleterInternal {...props} />;
}
