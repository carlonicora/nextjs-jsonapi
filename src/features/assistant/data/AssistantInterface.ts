import { ApiDataInterface } from "../../../core";

export type AssistantInput = {
  firstMessage: string;
  title?: string;
  howToMode?: boolean;
  limitToHowToId?: string;
  /**
   * BlockNote document behind `firstMessage`. Sent alongside the flattened
   * text so the server can re-derive the content and read `@`-mentions from
   * the inline nodes; the flattened text is never trusted on its own.
   */
  contentBlocks?: unknown[];
  /**
   * Resource the thread is bound to (e.g. a campaign). Confines every agent
   * data-access point in the run to that resource's scope.
   */
  boundContent?: { type: string; id: string };
};

export interface AssistantInterface extends ApiDataInterface {
  get title(): string;
  get messageCount(): number;
  /** Agent engine the thread runs on — `"operator"` or undefined (responder). */
  get engine(): string | undefined;
  /** JSON:API type of the resource this thread is bound to, when bound. */
  get boundContentType(): string | undefined;
  /** Id of the resource this thread is bound to, when bound. */
  get boundContentId(): string | undefined;
}
