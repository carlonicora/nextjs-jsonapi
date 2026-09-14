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
export function HandbookPageDetails({ handbookPage }: HandbookPageDetailsProps) {
  return <ReactMarkdownContainer content={handbookPageContent(handbookPage)} />;
}
