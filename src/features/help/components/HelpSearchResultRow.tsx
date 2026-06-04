"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LifeBuoyIcon, ArrowUpRightIcon } from "lucide-react";
import { CommandItem } from "../../../shadcnui";
import { usePageUrlGenerator } from "../../../client";
import { HowToService } from "../../how-to/data/HowToService";
import type { HowToInterface } from "../../how-to/data/HowToInterface";

export interface HelpSearchResultRowProps {
  result: { id: string; name: string; entityType: string };
  onSelect?: () => void;
}

export function HelpSearchResultRow({ result, onSelect }: HelpSearchResultRowProps) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const [article, setArticle] = useState<HowToInterface | null>(null);
  useEffect(() => {
    let active = true;
    HowToService.findOne({ id: result.id })
      .then((a) => active && setArticle(a))
      .catch(() => active && setArticle(null));
    return () => {
      active = false;
    };
  }, [result.id]);

  if (!article) {
    return (
      <CommandItem
        value={result.id}
        disabled
        className="text-muted-foreground cursor-not-allowed px-3 py-1.5 text-sm italic"
      >
        {t("help.search.removed")}
      </CommandItem>
    );
  }

  return (
    <CommandItem value={result.id} onSelect={onSelect} className="cursor-pointer p-0">
      <Link
        href={generateUrl({ page: `/help/${article.howToType}/${article.slug}` })}
        className="hover:bg-muted flex w-full items-center gap-3 rounded px-3 py-2"
      >
        <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <LifeBuoyIcon className="h-5 w-5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-foreground truncate text-sm font-semibold">{article.name}</span>
          <span className="text-muted-foreground truncate text-xs">
            {t(`help.modes.${article.howToType}`)} · {article.summary}
          </span>
        </div>
        <ArrowUpRightIcon className="text-muted-foreground h-5 w-5 shrink-0" />
      </Link>
    </CommandItem>
  );
}
