"use client";

import { HowToInterface } from "@/features/essentials/how-to/data/HowToInterface";
import { HowToService } from "@/features/essentials/how-to/data/HowToService";
import { CommonDeleter } from "@carlonicora/nextjs-jsonapi/components";
import { usePageUrlGenerator } from "@carlonicora/nextjs-jsonapi/client";

import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { useTranslations } from "next-intl";

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
