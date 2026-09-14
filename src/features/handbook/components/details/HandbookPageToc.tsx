"use client";

import { List } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";

import { MicroLabel } from "../../../../components";
import { cn } from "../../../../utils/cn";

type HandbookPageTocProps = {
  /** The `id` of the element holding the rendered markdown. */
  containerId: string;
};

type TocHeading = {
  id: string;
  text: string;
  level: number;
};

/**
 * The heading index of the page being read.
 *
 * Follows `HowToTableOfContents` (apps/web how-to detail): the same
 * IntersectionObserver tracking, the same rootMargin, the same
 * topmost-visible-wins rule and the same smooth scroll on click. Only the
 * heading SOURCE differs — the how-to reads BlockNote blocks and assigns the
 * ids itself, this one reads the ids `rehype-slug` already put on the rendered
 * markdown, so the entries are anchors with a real `href` rather than buttons.
 */
export function HandbookPageToc({ containerId }: HandbookPageTocProps) {
  const t = useTranslations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [headingsWithIds, setHeadingsWithIds] = useState<Map<string, Element>>(new Map());

  // Read the headings out of the rendered markdown, and re-read them whenever
  // the container's content changes — a different page renders into the same
  // container without this component ever unmounting.
  useEffect(() => {
    const contentPanel = document.getElementById(containerId);
    if (!contentPanel) return;

    const collect = () => {
      const headingElements = contentPanel.querySelectorAll("h1, h2, h3");
      const nextHeadings: TocHeading[] = [];
      const nextMap = new Map<string, Element>();

      headingElements.forEach((el) => {
        if (!el.id) return;
        nextHeadings.push({
          id: el.id,
          text: el.textContent ?? "",
          level: Number(el.tagName.slice(1)),
        });
        nextMap.set(el.id, el);
      });

      setHeadings(nextHeadings);
      setHeadingsWithIds(nextMap);
    };

    collect();

    const observer = new MutationObserver(collect);
    observer.observe(contentPanel, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [containerId]);

  // Set up IntersectionObserver for scroll tracking
  useEffect(() => {
    if (headingsWithIds.size === 0) return;

    /*
      `root: null` — the VIEWPORT, deliberately.

      The previous version looked for a `.overflow-y-auto` descendant of the
      content panel and used that as the root. There is none: the element that
      actually scrolls is an ANCESTOR (the page container's scroll body), so the
      root fell back to the content panel itself, which never moves relative to
      its own children. The observer therefore fired once on mount and never
      again, and the only thing that ever changed the highlight was a click.

      Viewport-relative intersection needs no knowledge of which ancestor
      scrolls — the headings move through the viewport either way.
    */
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          // Sort by their position in the document and pick the first
          const topEntry = visibleEntries.reduce((top, entry) => {
            const topRect = top.boundingClientRect;
            const entryRect = entry.boundingClientRect;
            return entryRect.top < topRect.top ? entry : top;
          });
          setActiveId(topEntry.target.id);
        }
      },
      {
        root: null,
        // The active band is the top tenth to top third of the viewport: a
        // heading is "where you are" once it has reached reading position, not
        // when it is still at the bottom edge.
        rootMargin: "-10% 0px -70% 0px",
        threshold: 0,
      },
    );

    headingsWithIds.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [containerId, headingsWithIds]);

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
      const element = headingsWithIds.get(id);
      if (!element) return;

      event.preventDefault();
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // Deliberately NOT setActiveId(id). The highlight answers "where am I",
      // and the observer answers that as the scroll lands. Setting it here made
      // it answer "where did I click" instead, and it stuck there.
    },
    [headingsWithIds],
  );

  // Don't render if no headings
  if (headings.length === 0) return null;

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center gap-2">
        <List className="text-muted-foreground h-4 w-4" />
        <MicroLabel>{t("handbook.reader.onThisPage")}</MicroLabel>
      </div>
      <nav aria-label={t("handbook.reader.onThisPage")} className="flex flex-col gap-y-0.5">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(event) => handleClick(event, heading.id)}
            className={cn(
              "hover:text-primary border-s-2 py-1 text-start text-xs transition-colors",
              heading.level === 1 && "ps-3",
              heading.level === 2 && "ps-5",
              heading.level === 3 && "ps-7",
              activeId === heading.id
                ? "border-primary text-primary font-medium"
                : "text-muted-foreground border-transparent",
            )}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
