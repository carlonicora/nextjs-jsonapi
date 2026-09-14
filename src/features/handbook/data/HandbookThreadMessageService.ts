import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { HandbookThreadMessageInput } from "./HandbookThreadMessageInterface";

export class HandbookThreadMessageService extends AbstractService {
  /**
   * Appends one question to an existing thread and runs the agent turn.
   *
   * It returns nothing on purpose: the caller reads the turn back with
   * `HandbookThreadService.findOne`, which is the one endpoint the contract
   * guarantees side-loads the full message list. That keeps a single code path
   * for "load the thread after a mutation" — the same one the sidebar's select
   * uses — instead of two ways of arriving at the transcript.
   *
   * The API answers 400 when the installation has no usable AI configuration
   * and 403 for a non-administrator; both reach the caller as a thrown error.
   */
  static async ask(params: HandbookThreadMessageInput & { threadId: string }): Promise<void> {
    await this.callApi({
      type: Modules.HandbookThreadMessage,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.HandbookThread,
        id: params.threadId,
        childEndpoint: Modules.HandbookThreadMessage,
      }).generate(),
      input: { id: params.id, question: params.question, handbookPageId: params.handbookPageId },
      suppressGlobalError: true,
    });
  }
}
