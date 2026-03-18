"use client";

import { useTranslations } from "next-intl";
import { AttributeElement, ContentTitle } from "../../../../components";
import { Modules } from "../../../../core";
import { useSharedContext } from "../../../../contexts/SharedContext";
import { Link } from "../../../../shadcnui";
import { HowTo } from "../../data/HowTo";
import { HowToInterface } from "../../data/HowToInterface";
import { useHowToContext } from "../../contexts/HowToContext";

type HowToDetailsProps = {
  howTo: HowToInterface;
};

function HowToDetailsInternal({ howTo }: HowToDetailsProps) {
  const t = useTranslations();
  const { title } = useSharedContext();
  const pagesList = HowTo.parsePagesFromString(howTo.pages);

  return (
    <div className="flex w-full flex-col gap-y-4">
      <ContentTitle type={title.type} element={title.element} functions={title.functions} module={Modules.HowTo} />

      {pagesList.length > 0 && (
        <div className="border-t pt-4">
          <AttributeElement
            title={t(`howto.fields.pages.label`)}
            value={
              <ul className="flex flex-col gap-y-1">
                {pagesList.map((page, index) => (
                  <li key={index}>
                    <Link href={page} className="text-primary hover:underline">
                      {page}
                    </Link>
                  </li>
                ))}
              </ul>
            }
          />
        </div>
      )}
    </div>
  );
}

export default function HowToDetails() {
  const { howTo } = useHowToContext();
  if (!howTo) return null;

  return <HowToDetailsInternal howTo={howTo} />;
}
