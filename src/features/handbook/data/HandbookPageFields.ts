/**
 * An ENUM, not a string array: `ContentListTable` indexes its column map by
 * these members and `useDataListRetriever` keys rows by the id member, exactly
 * as HowToFields does.
 *
 * `content` and `contentHash` are deliberately absent: they are detail-only,
 * and a list of a thousand markdown files must not carry their bodies.
 * `displayContent` — the same body in the reader's language — carries the same
 * caveat: it names the field for the detail read and is deliberately NOT in the
 * module's list inclusion.
 *
 * `section`, `order` and `summary` are list-safe for the opposite reason: they
 * are the index fields the contents page groups, orders and describes pages by,
 * so a list that omitted them could not render a table of contents at all.
 * `displayTitle` and `displaySummary` travel with them: the manual is indexed
 * in English and shown translated, so the contents page needs both halves.
 */
export enum HandbookPageFields {
  handbookPageId = "handbookPageId",

  path = "path",
  title = "title",
  displayTitle = "displayTitle",
  section = "section",
  order = "order",
  summary = "summary",
  displaySummary = "displaySummary",
  displayContent = "displayContent",
  wordCount = "wordCount",
  aiStatus = "aiStatus",
}
