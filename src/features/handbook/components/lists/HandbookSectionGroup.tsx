"use client";

import { useMemo } from "react";

import { MicroLabel, SectionHeader } from "../../../../components/typography";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { Link } from "../../../../shadcnui";
import { handbookPageSummary, handbookPageTitle } from "../../data/handbookDisplay";
import { HandbookPageInterface } from "../../data/HandbookPageInterface";

type HandbookSectionGroupProps = {
  /** Rendered as the section's `h2`. Already prettified and translated by the caller. */
  title: string;
  /** The README blurb for the section, already translated by the caller. */
  summary?: string;
  /** The section's pages, already sorted by `order` by the caller. */
  pages: HandbookPageInterface[];
};

/**
 * One section of the contents page: a heading, its blurb, and its pages.
 *
 * A page whose path nests below the section's own directory
 * (`02-framework/rulebook/frontend/01-models.md` inside `02-framework`) is not
 * a peer of the section's direct pages, so it renders under a micro-label
 * naming the intermediate directories. The nesting is read off the path rather
 * than stored, because the filesystem is the only place it is declared.
 */
export function HandbookSectionGroup({ title, summary, pages }: HandbookSectionGroupProps) {
  const generateUrl = usePageUrlGenerator();

  const { direct, nested } = useMemo(() => splitByNesting(pages), [pages]);

  return (
    <section className="flex flex-col gap-4">
      {/*
        The rule belongs to the heading block, not between the sections: it
        marks where a section starts, so the generous gap above it reads as
        separation and the tight gap below it as belonging.
      */}
      <div className="flex flex-col gap-1 border-b pb-3">
        <SectionHeader level={2}>{title}</SectionHeader>
        {summary ? <p className="text-muted-foreground text-sm">{summary}</p> : null}
      </div>

      {direct.length > 0 ? <HandbookPageRows pages={direct} generateUrl={generateUrl} /> : null}

      {nested.map((group) => (
        <div key={group.label} className="flex flex-col gap-1.5 pt-2">
          <MicroLabel>{group.label}</MicroLabel>
          <HandbookPageRows pages={group.pages} generateUrl={generateUrl} />
        </div>
      ))}
    </section>
  );
}

function HandbookPageRows({
  pages,
  generateUrl,
}: {
  pages: HandbookPageInterface[];
  generateUrl: ReturnType<typeof usePageUrlGenerator>;
}) {
  return (
    <ul className="divide-border/60 flex flex-col divide-y">
      {pages.map((page) => {
        // The translation when the ingest matched one, the English original
        // when it did not. Resolved once per row rather than per element.
        const summary = handbookPageSummary(page);

        return (
          <li key={page.id}>
            {/*
              The whole row is the link, not just the title: the summary describes
              the same destination, and a second click target beside it would be a
              second thing to aim at for no second outcome.

              `text-sm` on the title and `text-xs` on the summary, not the
              inherited base size — a row is a detail pair (roles 13 and 12), and
              at base size it competed with the section heading above it instead
              of sitting under it.
            */}
            <Link
              href={generateUrl({ page: Modules.HandbookPage, id: page.id })}
              className="hover:bg-muted/40 -mx-2 block rounded-md px-2 py-2"
            >
              <span className="text-primary block text-sm font-medium">{handbookPageTitle(page)}</span>
              {summary ? (
                <span className="text-muted-foreground mt-0.5 block text-xs font-normal">{sentenceCase(summary)}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The README writes each summary as a continuation of its link — "— boot, log
 * in, create a proceeding" — so pasted in raw every row starts lowercase. Here
 * the summary is a sentence of its own and reads as one.
 *
 * Only an ASCII letter is raised: several summaries open with a backtick
 * (`` `defineEntity()` and everything derived from it ``) or a quotation mark,
 * and those must survive untouched.
 */
function sentenceCase(summary: string): string {
  const first = summary.charAt(0);
  if (first < "a" || first > "z") return summary;
  return first.toUpperCase() + summary.slice(1);
}

/**
 * Splits a section's pages into the ones that sit directly in its directory and
 * the ones that sit in a directory below it, keyed by the intermediate path.
 *
 * `03-backend/testing.md` is direct. `02-framework/rulebook/frontend/01-models.md`
 * belongs to the group `rulebook / frontend`. The groups come out in path order
 * and always after the direct pages, so a section reads as its own pages first
 * and its sub-topics after.
 */
function splitByNesting(pages: HandbookPageInterface[]): {
  direct: HandbookPageInterface[];
  nested: { label: string; pages: HandbookPageInterface[] }[];
} {
  const direct: HandbookPageInterface[] = [];
  const groups = new Map<string, HandbookPageInterface[]>();

  for (const page of pages) {
    const segments = (page.order || page.path || "").split("/").filter((segment) => segment.length > 0);
    // Drop the filename, then the section's own directory.
    const intermediate = segments.slice(0, -1).slice(1);

    if (intermediate.length === 0) {
      direct.push(page);
      continue;
    }

    const label = intermediate.join(" / ");
    const existing = groups.get(label);
    if (existing) existing.push(page);
    else groups.set(label, [page]);
  }

  const nested = Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, groupPages]) => ({ label, pages: groupPages }));

  return { direct, nested };
}
