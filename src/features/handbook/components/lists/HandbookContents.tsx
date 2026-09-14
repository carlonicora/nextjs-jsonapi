"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { RoundPageContainer } from "../../../../components/containers/RoundPageContainer";
import { Modules } from "../../../../core";
import { HandbookProvider } from "../../contexts/HandbookContext";
import { handbookSectionSummary, handbookSectionTitle } from "../../data/handbookDisplay";
import { HandbookPageInterface } from "../../data/HandbookPageInterface";
import { HandbookPageService } from "../../data/HandbookPageService";
import { HandbookSectionInterface } from "../../data/HandbookSectionInterface";
import { HandbookSectionService } from "../../data/HandbookSectionService";
import { HandbookAskSheet } from "../containers/HandbookAskSheet";
import HandbookSyncButton from "../forms/HandbookSyncButton";
import { HandbookIndexStatus } from "../parts/HandbookIndexStatus";
import { HandbookSectionGroup } from "./HandbookSectionGroup";

type RenderedSection = {
  key: string;
  title: string;
  summary?: string;
  pages: HandbookPageInterface[];
};

/**
 * The contents surface: the manual's table of contents, replacing the four
 * column table of indexed files.
 *
 * It owns `RoundPageContainer` rather than being handed one, because
 * `RoundPageContainerTitle` reads its heading from `useSharedContext()` and the
 * provider that supplies it therefore has to be an ANCESTOR of the container —
 * exactly the composition `HandbookAskContainer` already uses. See the
 * hand-off note: the plan put the provider inside the container, which throws.
 */
export default function HandbookContents() {
  const t = useTranslations();

  const [pages, setPages] = useState<HandbookPageInterface[]>([]);
  const [sections, setSections] = useState<HandbookSectionInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      // The two loads are INDEPENDENT on purpose. A failed section read must
      // not take the pages down with it: without sections the contents page
      // falls back to the raw section keys, which is exactly what an nja
      // application with no README index renders anyway.
      const loadedPages = HandbookPageService.findMany({ fetchAll: true })
        .then((result) => {
          if (!cancelled) setPages(result ?? []);
        })
        .catch(() => {
          if (!cancelled) setPages([]);
        });

      const loadedSections = HandbookSectionService.findMany()
        .then((result) => {
          if (!cancelled) setSections(result ?? []);
        })
        .catch(() => {
          if (!cancelled) setSections([]);
        });

      await Promise.allSettled([loadedPages, loadedSections]);
      if (!cancelled) setIsLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  /** `HandbookSyncButton` awaits this before it toasts; re-running the effect refetches both resources. */
  const refresh = useCallback(async () => {
    setReloadToken((token) => token + 1);
  }, []);

  const renderedSections = useMemo(
    () => buildSections({ pages, sections, untitled: t("handbook.sections.untitled") }),
    [pages, sections, t],
  );

  return (
    <HandbookProvider
      functions={
        <>
          <HandbookAskSheet />
          <HandbookSyncButton refresh={refresh} />
          <HandbookIndexStatus pages={pages} />
        </>
      }
    >
      {/*
        NOT `fullWidth`. That flag strips the container's `mx-auto max-w-6xl`
        and its padding (RoundPageContainer.tsx:477-484) — it exists for the
        edge-to-edge table this page replaced. A contents page is prose: it
        wants the same centred, padded column every other non-table page in the
        app uses, and a summary line running to 1900px is unreadable.
      */}
      <RoundPageContainer module={Modules.HandbookPage} forceHeader>
        {isLoading ? null : renderedSections.length === 0 ? (
          <span className="text-muted-foreground text-sm">{t("handbook.empty")}</span>
        ) : (
          <div className="flex w-full flex-col gap-10">
            {renderedSections.map((section) => (
              <HandbookSectionGroup
                key={section.key}
                title={section.title}
                summary={section.summary}
                pages={section.pages}
              />
            ))}
          </div>
        )}
      </RoundPageContainer>
    </HandbookProvider>
  );
}

/**
 * Turns the two loaded lists into the sections the page renders, in order.
 *
 * Three degradations, all of them load-bearing:
 *
 * 1. No sections loaded — the endpoint failed, or the application has no
 *    README index — falls back to the distinct `section` values of the pages,
 *    sorted, with the raw key as the heading and no blurb.
 * 2. A section declared by the index but matching no page renders with its
 *    blurb and an empty list. Visible drift beats a silently dropped heading.
 * 3. A page whose `section` is empty or matches no loaded section lands in a
 *    trailing group. A file at the root of the tree is one of those.
 *
 * The grouping and both sorts read `section`, `order` and `path`, which stay
 * English: the manual is indexed in English and only shown translated. The two
 * strings a section actually prints go through the display helpers, so a
 * translated section renders translated and an untranslated one renders the
 * English original it was indexed under.
 */
function buildSections(params: {
  pages: HandbookPageInterface[];
  sections: HandbookSectionInterface[];
  untitled: string;
}): RenderedSection[] {
  const byOrder = (a: string, b: string) => a.localeCompare(b);

  const ordered: { key: string; title: string; summary?: string }[] =
    params.sections.length > 0
      ? [...params.sections]
          .sort((a, b) => byOrder(a.order || a.key, b.order || b.key))
          .map((section) => ({
            key: section.key,
            title: handbookSectionTitle(section) || section.key,
            summary: handbookSectionSummary(section),
          }))
      : Array.from(new Set(params.pages.map((page) => page.section).filter((key) => !!key)))
          .sort(byOrder)
          .map((key) => ({ key, title: key }));

  const known = new Set(ordered.map((section) => section.key));

  const grouped = new Map<string, HandbookPageInterface[]>();
  const leftovers: HandbookPageInterface[] = [];

  for (const page of params.pages) {
    const key = page.section;
    if (!key || !known.has(key)) {
      leftovers.push(page);
      continue;
    }

    const existing = grouped.get(key);
    if (existing) existing.push(page);
    else grouped.set(key, [page]);
  }

  const sortPages = (pages: HandbookPageInterface[]) =>
    [...pages].sort((a, b) => byOrder(a.order || a.path || a.title, b.order || b.path || b.title));

  const response: RenderedSection[] = ordered.map((section) => ({
    ...section,
    pages: sortPages(grouped.get(section.key) ?? []),
  }));

  if (leftovers.length > 0)
    response.push({ key: "", title: params.untitled, summary: undefined, pages: sortPages(leftovers) });

  return response;
}
