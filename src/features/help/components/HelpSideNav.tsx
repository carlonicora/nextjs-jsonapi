"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HELP_MODES } from "../types/help-article.types";
import { usePageUrlGenerator } from "../../../client";
import { useHelpFilter } from "../hooks/useHelpFilter";
import { HowToService } from "../../how-to/data/HowToService";
import type { HowToInterface } from "../../how-to/data/HowToInterface";

export function HelpSideNav() {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const pathname = usePathname();
  const [articles, setArticles] = useState<HowToInterface[]>([]);

  useEffect(() => {
    let active = true;
    HowToService.findPublished()
      .then((list) => active && setArticles(list))
      .catch(() => active && setArticles([]));
    return () => {
      active = false;
    };
  }, []);

  // useHelpFilter indexes by title/summary/tags — map HowTo getters into the shape it expects.
  const indexable = useMemo(
    () =>
      articles.map((a) => ({
        id: a.id,
        title: a.name,
        summary: a.summary ?? "",
        tags: a.tags,
        mode: a.howToType ?? "",
        slug: a.slug ?? "",
      })),
    [articles],
  );
  const { query, setQuery, filtered } = useHelpFilter(indexable as any);
  const filtering = query.trim().length > 0;

  const groups = useMemo(
    () =>
      HELP_MODES.map((mode) => ({
        mode,
        articles: articles
          .filter((a) => a.howToType === mode && !a.draft)
          .sort((x, y) => (x.order ?? 0) - (y.order ?? 0)),
      })),
    [articles],
  );

  const isActive = (mode: string, slug: string) => pathname.endsWith(`/help/${mode}/${slug}`);

  return (
    <nav aria-label="Help navigation" className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("help.sideNav.filterPlaceholder")}
        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
      />
      {filtering ? (
        (filtered as any[]).length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("help.sideNav.noMatches")}</p>
        ) : (
          <ul className="space-y-1">
            {(filtered as any[]).map((a) => (
              <li key={a.id}>
                <Link
                  href={generateUrl({ page: `/help/${a.mode}/${a.slug}` })}
                  className={
                    "hover:bg-muted block rounded px-2 py-1 text-sm " +
                    (isActive(a.mode, a.slug) ? "bg-muted font-medium" : "")
                  }
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        groups.map((group) => {
          if (group.articles.length === 0) return null;
          return (
            <div key={group.mode}>
              <Link
                href={generateUrl({ page: `/help/${group.mode}` })}
                className="text-muted-foreground hover:text-foreground mb-1 block text-xs font-semibold tracking-wider uppercase"
              >
                {t(`help.modes.${group.mode}`)}
              </Link>
              <ul className="space-y-0.5">
                {group.articles.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={generateUrl({ page: `/help/${a.howToType}/${a.slug}` })}
                      className={
                        "hover:bg-muted block rounded px-2 py-1 text-sm " +
                        (isActive(a.howToType ?? "", a.slug ?? "") ? "bg-muted font-medium" : "")
                      }
                    >
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </nav>
  );
}
