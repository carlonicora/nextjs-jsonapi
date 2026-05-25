"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useHelp } from "../../contexts/HelpContext";
import { usePageUrlGenerator } from "../../../../client";
import { articleUrl } from "../../utils/articleUrl";

export function Related({ slugs }: { slugs: string[] }) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { manifest } = useHelp();
  const items = slugs
    .map((s) => manifest.find((a) => `${a.mode}/${a.slug}` === s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  if (items.length === 0) return null;
  return (
    <aside className="my-6">
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
        {t("help.article.related")}
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((a) => (
          <li key={a.id}>
            <Link href={articleUrl(generateUrl, a)} className="hover:bg-muted block rounded border p-3">
              <div className="font-medium">{a.title}</div>
              <div className="text-muted-foreground text-xs">{a.summary}</div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
