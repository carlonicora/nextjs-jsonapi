"use client";

import { useHowToContext } from "@/features/essentials/how-to/contexts/HowToContext";
import { AttributeElement, ContentTitle, ReactMarkdownContainer } from "@carlonicora/nextjs-jsonapi/components";
import { useSharedContext } from "@carlonicora/nextjs-jsonapi/contexts";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { useTranslations } from "next-intl";

function HowToDetailsInternal() {
  const { howTo, reloadHowTo } = useHowToContext();
  const t = useTranslations();
  const { title } = useSharedContext();

  if (!howTo) return null;

  return (
    <div className="flex w-full flex-col gap-y-2">
      <ContentTitle type={title.type} element={title.element} functions={title.functions} module={Modules.HowTo} />
      <AttributeElement
        title={t(`generic.abstract`)}
        value={<ReactMarkdownContainer size="small" content={howTo.abstract} />}
      />
      <AttributeElement
        title={t(`features.howTo.fields.description.label`)}
        value={howTo.description}
      />
      <AttributeElement
        title={t(`features.howTo.fields.pages.label`)}
        value={howTo.pages}
      />
      <AttributeElement
        title={t(`features.howTo.fields.aiStatus.label`)}
        value={howTo.aiStatus}
      />
      {howTo.author && (
        <AttributeElement
          title={t(`generic.relationships.author.label`)}
          value={howTo.author.name}
        />
      )}
    </div>
  );
}

export default function HowToDetails() {
  const { howTo } = useHowToContext();
  if (!howTo) return null;

  return <HowToDetailsInternal />;
}
