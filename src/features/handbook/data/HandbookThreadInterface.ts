import { AssistantInterface } from "../../assistant/data/AssistantInterface";
import { HandbookThreadMessageInterface } from "./HandbookThreadMessageInterface";

/**
 * A persisted handbook conversation.
 *
 * It extends `AssistantInterface` so the shared chat chrome —
 * `AssistantSidebar`, `AssistantThreadHeader`, `groupThreadsByBucket` — accepts
 * it verbatim. It is NOT an Assistant: an Assistant is company scoped and a
 * platform administrator has no company, so the handbook owns its own threads
 * and answers `engine` / `boundContentType` / `boundContentId` with `undefined`.
 */
export interface HandbookThreadInterface extends AssistantInterface {
  /** Side-loaded by `GET /handbookthreads/:id`; empty on the list endpoint. */
  get messages(): HandbookThreadMessageInterface[];
}

/**
 * The payload that opens a thread: the first question. The server derives the
 * title from it, so nothing else is sent.
 */
export type HandbookThreadInput = {
  id: string;
  question: string;
  /**
   * Scopes retrieval to one handbook page. Set only by the reader's ask sheet,
   * when the reader turns the "this page only" chip on; absent everywhere else,
   * and the agent then searches the whole manual.
   */
  handbookPageId?: string;
};
