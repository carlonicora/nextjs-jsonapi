import { HandbookPageInterface } from "./HandbookPageInterface";
import { HandbookSectionInterface } from "./HandbookSectionInterface";

/**
 * The handbook is INDEXED in English and SHOWN translated.
 *
 * A page's translation lives on the same node as its English original — matched
 * by `path` at ingest time — and arrives as ordinary attributes beside it.
 * There is no second id, no locale in any URL and no second resource, so
 * nothing about ordering, grouping or section membership changes: `path`,
 * `order` and `section` stay English and are still what every sort reads. Only
 * the rendered words are resolved here.
 *
 * These five functions are the ONE place that resolution happens. A component
 * reaching for `page.title` directly renders English to an Italian reader, and
 * a per-component `??` would be five copies of the same rule to keep in step.
 *
 * Each parameter is a `Pick` of the interface rather than the whole of it, so a
 * caller holding a projection — a row from a sparse fieldset, a spec fixture —
 * passes it without a cast, while a rename on either interface still breaks
 * this file rather than drifting from it.
 */

/** The page title to render: the translation when there is one, else English. */
export function handbookPageTitle(page: Pick<HandbookPageInterface, "title" | "displayTitle">): string {
  return page.displayTitle ?? page.title;
}

/** The page's one-line description, translated when the ingest matched one. */
export function handbookPageSummary(
  page: Pick<HandbookPageInterface, "summary" | "displaySummary">,
): string | undefined {
  return page.displaySummary ?? page.summary;
}

/**
 * The markdown body to render. Detail-only, exactly as `content` is:
 * `displayContent` is the whole file and is absent from every list payload, so
 * this is never called on a row that came out of a list read.
 */
export function handbookPageContent(page: Pick<HandbookPageInterface, "content" | "displayContent">): string {
  return page.displayContent ?? page.content;
}

/** The section heading to render, translated when the ingest matched one. */
export function handbookSectionTitle(section: Pick<HandbookSectionInterface, "title" | "displayTitle">): string {
  return section.displayTitle ?? section.title;
}

/** The section blurb to render, translated when the ingest matched one. */
export function handbookSectionSummary(
  section: Pick<HandbookSectionInterface, "summary" | "displaySummary">,
): string | undefined {
  return section.displaySummary ?? section.summary;
}
