import { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";

/**
 * One turn of a persisted handbook conversation.
 *
 * It extends `AssistantMessageInterface` rather than restating it: the shared
 * chat components (`AssistantThread` → `MessageList` → `MessageItem`) are typed
 * against that interface and take their data as plain props, so a handbook
 * message that satisfies the same structural contract renders through them with
 * no adapter. Everything the handbook has no concept of — token counts,
 * references, citations, approval actions — is answered with the empty value.
 *
 * `sources` is the handbook's own addition: repo-relative page paths, in the
 * order retrieval returned them.
 */
export interface HandbookThreadMessageInterface extends AssistantMessageInterface {
  get sources(): string[];
}

/**
 * The payload of one question appended to an existing thread. `id` is the
 * client-generated identity every model input in this framework carries; the
 * append endpoint derives role and position server-side, so the envelope the
 * model builds sends only `question`.
 */
export type HandbookThreadMessageInput = {
  id: string;
  question: string;
  /**
   * Scopes retrieval to one handbook page. Set only by the reader's ask sheet,
   * when the reader turns the "this page only" chip on; absent everywhere else,
   * and the agent then searches the whole manual.
   */
  handbookPageId?: string;
};
