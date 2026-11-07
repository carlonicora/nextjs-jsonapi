"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePageUrlGenerator } from "../../../client";
import { useDateFormatter } from "../../../contexts/DateLocaleContext";

type Sibling = { howToType: string; slug: string; title: string };

export function HelpArticleBody(props: {
  howToType: string;
  title: string;
  summary?: string;
  updatedAt?: string;
  prev?: Sibling | null;
  next?: Sibling | null;
  children: ReactNode;
}) {
  const t = useTranslations();
  const dates = useDateFormatter();
  const generateUrl = usePageUrlGenerator();
  const { howToType, title, summary, updatedAt, prev, next, children } = props;

  return (
    <article className="prose dark:prose-invert max-w-none">
      <nav className="text-muted-foreground mb-2 text-xs">
        <Link href={generateUrl({ page: "/help" })}>{t("help.title")}</Link>
        {" · "}
        <Link href={generateUrl({ page: `/help/${howToType}` })}>{t(`help.modes.${howToType}`)}</Link>
      </nav>
      <h1>{title}</h1>
      {summary ? <p className="text-muted-foreground !mt-0 text-base">{summary}</p> : null}
      {children}
      <hr className="my-6" />
      {updatedAt ? (
        <div className="text-muted-foreground text-xs">
          <span>
            {t("help.article.lastUpdated", {
              date: dates.format(updatedAt, "date"),
            })}
          </span>
        </div>
      ) : null}
      <div className="mt-4 flex justify-between text-sm">
        {prev ? (
          <Link href={generateUrl({ page: `/help/${prev.howToType}/${prev.slug}` })}>
            ← {t("help.article.previous")}: {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={generateUrl({ page: `/help/${next.howToType}/${next.slug}` })}>
            {t("help.article.next")}: {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </article>
  );
}
