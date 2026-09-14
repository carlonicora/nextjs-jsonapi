"use client";

import { BookOpenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";

import { MicroLabel } from "../../../../components";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { Link } from "../../../../shadcnui";
import { cn } from "../../../../utils/cn";
import { handbookPageTitle, handbookSectionTitle } from "../../data/handbookDisplay";
import { HandbookPageInterface } from "../../data/HandbookPageInterface";
import { HandbookSectionInterface } from "../../data/HandbookSectionInterface";

type HandbookPageNavigatorProps = {
  pages: HandbookPageInterface[];
  sections: HandbookSectionInterface[];
  currentId: string;
};

/**
 * The manual's section tree, beside the page being read.
 *
 * A list of links, NOT `RoundPageContainer`'s `layout="rail"`: the rail renders
 * a `TabsContent` per tab, so 120 pages would mean 120 content nodes and a
 * client-side tab switch. A manual wants 120 real, shareable URLs and a working
 * back button, which is what an anchor gives and a tab does not.
 *
 * Degrades the same way the contents surface does: a page whose `section`
 * matches no loaded section — or has none at all — lands in a trailing group,
 * and if no sections loaded at all the distinct page keys are used as written.
 */
export function HandbookPageNavigator({ pages, sections, currentId }: HandbookPageNavigatorProps) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const groups = useMemo(() => {
    const byKey = new Map<string, HandbookPageInterface[]>();
    for (const page of pages) {
      const key = page.section ?? "";
      const bucket = byKey.get(key);
      if (bucket) bucket.push(page);
      else byKey.set(key, [page]);
    }

    for (const bucket of byKey.values()) bucket.sort((a, b) => (a.order ?? "").localeCompare(b.order ?? ""));

    const ordered: { key: string; title: string; pages: HandbookPageInterface[] }[] = [];
    const consumed = new Set<string>();

    for (const section of sections) {
      const sectionPages = byKey.get(section.key);
      if (!sectionPages) continue;
      consumed.add(section.key);
      ordered.push({ key: section.key, title: handbookSectionTitle(section), pages: sectionPages });
    }

    // Whatever the loaded sections did not describe: an unknown key, an empty
    // one, or every key when the section load failed outright.
    const leftovers = [...byKey.keys()].filter((key) => !consumed.has(key)).sort((a, b) => a.localeCompare(b));

    for (const key of leftovers)
      ordered.push({
        key: key.length > 0 ? key : "__untitled",
        title: key.length > 0 ? key : t("handbook.sections.untitled"),
        pages: byKey.get(key) ?? [],
      });

    return ordered;
  }, [pages, sections, t]);

  const currentRef = useRef<HTMLAnchorElement | null>(null);

  /*
    Bring the current page into view inside the rail — 120 entries means it is
    usually below the fold, and a position marker nobody can see marks nothing.

    Deliberately NOT `scrollIntoView`: that walks up every scrollable ancestor,
    so it would scroll the page itself and land the reader halfway down the
    article they just opened. Setting `scrollTop` on the rail moves the rail and
    only the rail.
  */
  useEffect(() => {
    const link = currentRef.current;
    if (!link) return;

    const rail = link.closest<HTMLElement>(".overflow-y-auto");
    if (!rail) return;

    rail.scrollTop = link.offsetTop - rail.clientHeight / 2 + link.clientHeight / 2;
  }, [currentId, groups]);

  if (groups.length === 0) return null;

  // No `max-h` / `overflow` on the nav: the reader's rail wrapper is the sticky
  // scroll container, and a second one nested inside it would trap the scroll
  // in the wrong element.
  /*
    Deliberately the same treatment as `HandbookPageToc`: an icon and a
    micro-label at the top, entries at `text-xs` on a `border-s-2` rail, and the
    current one marked by turning that rail `border-primary` rather than by
    growing.

    The previous version gave the current page `text-primary font-medium` with
    no size class, so it inherited the base size and rendered far larger than
    its neighbours — the entry moved instead of being marked, and there was no
    rail to show position at all. The two rails of this page are the same kind
    of object and now read as one.
  */
  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center gap-2">
        <BookOpenIcon className="text-muted-foreground h-4 w-4" />
        <MicroLabel>{t("handbook.reader.contents")}</MicroLabel>
      </div>
      <nav aria-label={t("handbook.reader.contents")} className="flex flex-col gap-y-3">
        {groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-y-0.5">
            <MicroLabel className="ps-3">{group.title}</MicroLabel>
            {group.pages.map((page) => {
              const isCurrent = page.id === currentId;
              return (
                <Link
                  key={page.id}
                  ref={isCurrent ? currentRef : undefined}
                  href={generateUrl({ page: Modules.HandbookPage, id: page.id })}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "hover:text-primary block border-s-2 py-1 ps-3 text-start text-xs leading-tight transition-colors",
                    isCurrent ? "border-primary text-primary font-medium" : "text-muted-foreground border-transparent",
                  )}
                >
                  {handbookPageTitle(page)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
