import { ApiDataInterface } from "../../../core";

export interface HandbookPageInterface extends ApiDataInterface {
  get path(): string;
  get title(): string;
  get content(): string;
  get contentHash(): string;
  get wordCount(): number;
  get aiStatus(): string | undefined;
  /** The top-level directory of the documentation tree this page belongs to. */
  get section(): string;
  /** The repo-relative path; sorting on it reproduces filesystem order. */
  get order(): string;
  /** The one-line description the tree's README index gives this page, when it has one. */
  get summary(): string | undefined;
  /**
   * The translated rendering of `title`, when the ingest matched a translation
   * of this page's `path`. The manual is INDEXED in English and SHOWN in the
   * reader's language, so every surface renders `displayTitle ?? title`.
   */
  get displayTitle(): string | undefined;
  /** The translated `summary`. Absent when the page has no translation. */
  get displaySummary(): string | undefined;
  /**
   * The translated body. Detail-only, exactly as `content` is: it is the whole
   * markdown file, so it never travels in a list payload.
   */
  get displayContent(): string | undefined;
}
