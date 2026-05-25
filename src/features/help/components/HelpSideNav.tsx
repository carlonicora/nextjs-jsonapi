"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HELP_MODES } from "../types/help-article.types";
import { usePageUrlGenerator } from "../../../client";
import { useHelp } from "../contexts/HelpContext";
import { useHelpFilter } from "../hooks/useHelpFilter";
import { buildHelpNav } from "../utils/helpNavigation";
import { articleUrl, modeUrl } from "../utils/articleUrl";

export function HelpSideNav() {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const pathname = usePathname();
  const { manifest } = useHelp();
  const groups = buildHelpNav(manifest);
  const allArticles = groups.flatMap((g) => g.articles);
  const { query, setQuery, filtered } = useHelpFilter(allArticles);
  const filtering = query.trim().length > 0;

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
        filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("help.sideNav.noMatches")}</p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((a) => (
              <li key={a.id}>
                <Link
                  href={articleUrl(generateUrl, a)}
                  className={
                    "hover:bg-muted block rounded px-2 py-1 text-sm " +
                    (pathname.endsWith(`/help/${a.mode}/${a.slug}`) ? "bg-muted font-medium" : "")
                  }
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        HELP_MODES.map((mode) => {
          const group = groups.find((g) => g.mode === mode)!;
          if (group.articles.length === 0) return null;
          return (
            <div key={mode}>
              <Link
                href={modeUrl(generateUrl, mode)}
                className="text-muted-foreground hover:text-foreground mb-1 block text-xs font-semibold tracking-wider uppercase"
              >
                {t(`help.modes.${mode}`)}
              </Link>
              <ul className="space-y-0.5">
                {group.articles.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={articleUrl(generateUrl, a)}
                      className={
                        "hover:bg-muted block rounded px-2 py-1 text-sm " +
                        (pathname.endsWith(`/help/${a.mode}/${a.slug}`) ? "bg-muted font-medium" : "")
                      }
                    >
                      {a.title}
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
