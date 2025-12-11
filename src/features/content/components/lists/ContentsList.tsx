"use client";

import { useTranslations } from "next-intl";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { HoverCard, HoverCardContent, HoverCardTrigger, Link } from "../../../../shadcnui";
import { getIconByModule } from "../../../../utils";
import { ContributorsList } from "../../../user/components";
import { ContentInterface } from "../../data";

type ContentsListProps = {
  contentList: ContentInterface[];
};

export function ContentsList({ contentList }: ContentsListProps) {
  const t = useTranslations();

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto">
      <h2 className="text-xl font-semibold">{t(`foundations.content.news`)}</h2>
      <div className="flex flex-col">
        {contentList.map((content) => (
          <ContentsListElement content={content} key={content.id} />
        ))}
      </div>
    </div>
  );
}

type ContentsListElementProps = {
  content: ContentInterface;
};

function ContentsListElement({ content }: ContentsListElementProps) {
  const generateUrl = usePageUrlGenerator();

  const contentModule = content.contentType ? Modules.findByModelName(content.contentType) : undefined;
  const link = contentModule ? generateUrl({ page: contentModule, id: content.id }) : "#";

  return (
    <div className="hover:bg-muted flex w-full flex-col gap-y-2 border-b p-2 py-4">
      <div className="flex w-full justify-between gap-x-2">
        <HoverCard>
          <HoverCardTrigger asChild>
            <Link href={link} className="flex w-full items-center justify-start gap-2 font-semibold">
              {contentModule && getIconByModule({ module: contentModule, className: "h-4 w-4" })}
              {content.name}
            </Link>
          </HoverCardTrigger>
          <HoverCardContent className="flex max-h-96 w-96 flex-col gap-y-4 overflow-y-auto">
            <Link href={link} className="font-semibold">
              {content.name}
            </Link>
            <div className="text-xs">{content.abstract}</div>
          </HoverCardContent>
        </HoverCard>
        <ContributorsList content={content} />
      </div>
      {/* <div className="text-muted-foreground text-xs">{content.tldr}</div>
      {content.topics.length > 0 && (
        <div className="flex w-full items-center justify-between">
          <TopicBadgesList topics={content.topics} limit={1} />
        </div>
      )} */}
    </div>
  );
}
