"use client";

import { ReactMarkdownContainer } from "../../../../components";
import { handbookPageContent } from "../../data/handbookDisplay";
import { HandbookPageInterface } from "../../data/HandbookPageInterface";

type HandbookPageDetailsProps = {
  handbookPage: HandbookPageInterface;
};

/**
 * `content` is markdown read from a file and rendered read-only. It is NOT a
 * BlockNote field: nothing edits it in the app, so no editor and no
 * blocks-to-text conversion is involved.
 *
 * The title and the file path are NOT rendered here. The reader's header owns
 * both — it names the section and the page — and repeating them above the
 * markdown's own H1 printed the title twice on every page.
 *
 * The body comes from `handbookPageContent`, so a page whose translation the
 * ingest matched renders in the reader's language and one without it falls back
 * to the English file. This is the detail read, which is the only read that
 * carries `displayContent` at all.
 */
/**
 * The reading column's type scale.
 *
 * `ReactMarkdownContainer`'s `size="normal"` puts NO size class on `p` or `li`,
 * so they inherit — and the app's root is 14px while the browser default the
 * container's own headings are sized against is 16px. The body therefore
 * rendered a step larger than every other piece of body copy in the product,
 * which role 7 of the typography system puts at `text-sm`.
 *
 * `text-sm` on the wrapper fixes the inherited elements by cascade. The heading
 * ladder has explicit classes and cannot cascade, so it is restated one step
 * down — a `text-3xl` H1 belongs to a page that has no header above it, and
 * this one is already titled twice over by the reader's header and breadcrumb.
 *
 * Scoped HERE rather than in the shared container on purpose: 23 other surfaces
 * render markdown through it — judgements, law articles, documents, legal
 * research reports — and changing its default would restyle all of them
 * silently. That alignment is worth making, but as its own change.
 */
const READING_SCALE = "text-sm [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-base [&_h4]:text-sm [&_table]:text-sm";

export function HandbookPageDetails({ handbookPage }: HandbookPageDetailsProps) {
  return (
    <div className={READING_SCALE}>
      <ReactMarkdownContainer content={handbookPageContent(handbookPage)} />
    </div>
  );
}
