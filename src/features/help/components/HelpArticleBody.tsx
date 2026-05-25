"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import type { HelpArticle } from "../types/help-article.types";
import { usePageUrlGenerator } from "../../../client";
import { useHelp } from "../contexts/HelpContext";
import { articleUrl } from "../utils/articleUrl";
import { prevNextWithinMode } from "../utils/helpNavigation";

export function HelpArticleBody({ article, children }: { article: HelpArticle; children: ReactNode }) {
  const t = useTranslations();
  const format = useFormatter();
  const generateUrl = usePageUrlGenerator();
  const { manifest } = useHelp();
  const { prev, next } = prevNextWithinMode(manifest, article);

  return (
    <article className="prose dark:prose-invert max-w-none">
      <nav className="text-muted-foreground mb-2 text-xs">
        <Link href={generateUrl({ page: "/help" })}>Help</Link>
        {" · "}
        <Link href={generateUrl({ page: `/help/${article.mode}` })}>{t(`help.modes.${article.mode}`)}</Link>
      </nav>
      <h1>{article.title}</h1>
      <p className="text-muted-foreground !mt-0 text-base">{article.summary}</p>
      {children}
      <hr className="my-6" />
      <div className="text-muted-foreground text-xs">
        <span>
          {t("help.article.lastUpdated", {
            date: format.dateTime(new Date(article.lastUpdated), { dateStyle: "short" }),
          })}
        </span>
      </div>
      <div className="mt-4 flex justify-between text-sm">
        {prev ? (
          <Link href={articleUrl(generateUrl, prev)} className="hover:underline">
            ← {t("help.article.previous")}: {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={articleUrl(generateUrl, next)} className="hover:underline">
            {t("help.article.next")}: {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </article>
  );
}
