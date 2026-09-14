import { ApiDataInterface } from "../../../core";

/**
 * One top-level directory of the configured documentation tree.
 *
 * A page names its section by `key`, not by edge, so this interface carries no
 * relationships: the contents page reads sections and pages in two calls and
 * groups them client side.
 */
export interface HandbookSectionInterface extends ApiDataInterface {
  /** The directory name, e.g. `03-backend`. The natural key of the ingest. */
  get key(): string;
  /** The prettified `key`, or the README heading when the index names one. */
  get title(): string;
  /** The README's blurb for the section. Absent when the tree has no index. */
  get summary(): string | undefined;
  /** The `key`; sorting on it reproduces the directories' numeric order. */
  get order(): string;
  /**
   * The translated rendering of `title`, when the index carries one. Every
   * reader-facing surface renders `displayTitle ?? title`.
   */
  get displayTitle(): string | undefined;
  /** The translated `summary`. Absent when the section has no translation. */
  get displaySummary(): string | undefined;
}
