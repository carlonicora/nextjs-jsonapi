"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import { HandbookProvider } from "../../contexts/HandbookContext";
import { HandbookPageInterface } from "../../data/HandbookPageInterface";
import { HandbookPageService } from "../../data/HandbookPageService";
import { HandbookSectionInterface } from "../../data/HandbookSectionInterface";
import { HandbookSectionService } from "../../data/HandbookSectionService";
import { HandbookPageDetails } from "../details/HandbookPageDetails";
import { HandbookPageNeighbours } from "../details/HandbookPageNeighbours";
import { HandbookPageToc } from "../details/HandbookPageToc";
import { HandbookPageNavigator } from "../parts/HandbookPageNavigator";
import { HandbookAskSheet } from "./HandbookAskSheet";

type HandbookPageContainerProps = {
  handbookPageId: string;
};

/** The element the heading index reads its headings out of. */
const CONTENT_CONTAINER_ID = "handbook-page-content";

/**
 * Fetches one page client-side from its id.
 *
 * The sibling how-to detail uses a server page that dehydrates into a provider.
 * This one does not, for the same reason the ask surface does not: a handbook
 * page is read-only and never edited, so there is no shared mutable state for a
 * provider to hold, and an id string crosses the server/client boundary without
 * any dehydrate/rehydrate ceremony.
 *
 * Three loads, deliberately separate: the page itself, the whole ordered page
 * list (the navigator and the prev/next pair need it) and the sections. The
 * section load has its own `try` — a failing sections endpoint degrades the
 * navigator to raw keys, and must never take the page being read down with it.
 */
export default function HandbookPageContainer({ handbookPageId }: HandbookPageContainerProps) {
  const t = useTranslations();
  const [handbookPage, setHandbookPage] = useState<HandbookPageInterface | undefined>(undefined);
  const [pages, setPages] = useState<HandbookPageInterface[]>([]);
  const [sections, setSections] = useState<HandbookSectionInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const page = await HandbookPageService.findOne({ id: handbookPageId });
        if (!cancelled) setHandbookPage(page);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [handbookPageId]);

  useEffect(() => {
    let cancelled = false;

    const loadPages = async () => {
      const allPages = await HandbookPageService.findMany({ fetchAll: true });
      if (!cancelled) setPages(allPages);
    };

    const loadSections = async () => {
      try {
        const allSections = await HandbookSectionService.findMany();
        if (!cancelled) setSections(allSections);
      } catch {
        if (!cancelled) setSections([]);
      }
    };

    void loadPages();
    void loadSections();

    return () => {
      cancelled = true;
    };
  }, []);

  const section = useMemo(
    () => sections.find((candidate) => candidate.key === handbookPage?.section),
    [sections, handbookPage],
  );

  return (
    <HandbookProvider
      page={handbookPage}
      section={section}
      functions={handbookPage ? <HandbookAskSheet handbookPageId={handbookPage.id} /> : undefined}
    >
      {/*
        `fullWidth` on the READER, unlike the contents page.

        The container's `max-w-6xl` exists to hold a reading measure, and the
        two rails are not reading — cramming navigator, prose and heading index
        into that one column squeezes the prose to a third of it. So the reader
        takes the full width and caps only its centre column, which is where the
        measure belongs.
      */}
      <RoundPageContainer module={Modules.HandbookPage} fullWidth forceHeader>
        {isLoading ? null : handbookPage ? (
          /*
            `items-start` is what makes `sticky` work on the two side columns:
            a grid item stretches to the row's height by default, so a sticky
            child inside it has nowhere to travel and the whole page scrolls
            instead. With `items-start` each column is only as tall as its
            content, and the rails hold their place while the page moves.

            Each rail wrapper owns the scrolling — the navigator carries no
            `max-h` of its own, so there is exactly one scroll container per
            rail rather than two nested ones.
          */
          <div className="grid items-start gap-8 p-4 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
            <div className="sticky top-4 hidden max-h-[calc(100svh-8rem)] overflow-y-auto lg:block">
              <HandbookPageNavigator pages={pages} sections={sections} currentId={handbookPage.id} />
            </div>
            {/* The measure lives HERE, on the prose, not on the whole page. */}
            <div id={CONTENT_CONTAINER_ID} className="mx-auto w-full max-w-3xl min-w-0">
              <HandbookPageDetails handbookPage={handbookPage} />
              <HandbookPageNeighbours pages={pages} currentId={handbookPage.id} />
            </div>
            <div className="sticky top-4 hidden max-h-[calc(100svh-8rem)] overflow-y-auto lg:block">
              <HandbookPageToc containerId={CONTENT_CONTAINER_ID} />
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">{t("handbook.notFound")}</span>
        )}
      </RoundPageContainer>
    </HandbookProvider>
  );
}
