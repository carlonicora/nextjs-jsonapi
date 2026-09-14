import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { HandbookThreadInput, HandbookThreadInterface } from "./HandbookThreadInterface";
import { HandbookThreadMessageInterface } from "./HandbookThreadMessageInterface";

export class HandbookThread extends AbstractApiData implements HandbookThreadInterface {
  private _title?: string;
  private _messageCount?: number;
  private _messages?: HandbookThreadMessageInterface[];

  get title(): string {
    return this._title ?? "";
  }

  get messageCount(): number {
    return this._messageCount ?? 0;
  }

  /**
   * The handbook runs one agent and has no engine choice, so nothing routes on
   * this. It exists because `AssistantInterface` declares it, which is what
   * lets the shared chat chrome take a handbook thread unchanged.
   */
  get engine(): string | undefined {
    return undefined;
  }

  /** A handbook thread is never bound to a product resource. */
  get boundContentType(): string | undefined {
    return undefined;
  }

  get boundContentId(): string | undefined {
    return undefined;
  }

  get messages(): HandbookThreadMessageInterface[] {
    return this._messages ?? [];
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};
    this._title = attributes.title;

    const fromMeta = data.jsonApi.meta?.messageCount;
    this._messageCount =
      typeof fromMeta === "number"
        ? fromMeta
        : typeof attributes.messageCount === "number"
          ? attributes.messageCount
          : 0;

    const messages = this._readIncluded<HandbookThreadMessageInterface>(
      data,
      "messages",
      Modules.HandbookThreadMessage,
    );
    this._messages = Array.isArray(messages) ? messages : messages ? [messages] : [];

    // `groupThreadsByBucket` buckets the sidebar on `updatedAt` as a Date, and
    // `AbstractApiData` only reads it from `meta`. A thread that carries the
    // timestamp as an attribute instead would otherwise fall back to "now" and
    // land every thread in "Today".
    if (this._updatedAt === undefined && attributes.updatedAt !== undefined)
      this._updatedAt = new Date(attributes.updatedAt);
    if (this._createdAt === undefined && attributes.createdAt !== undefined)
      this._createdAt = new Date(attributes.createdAt);

    return this;
  }

  /**
   * The envelope `POST /handbookthreads` accepts: the opening question. The
   * server derives the title from it, so no title is sent and no client id —
   * the thread's identity is the server's to mint.
   *
   * `handbookPageId` rides the same way `question` does, through this method
   * and never through `overridesJsonApiCreation`. It is written only when the
   * caller supplied it: the DTO takes it as optional, and sending an explicit
   * `null` would fail validation rather than mean "the whole manual".
   */
  createJsonApi(data: HandbookThreadInput) {
    return {
      data: {
        type: Modules.HandbookThread.name,
        attributes: {
          question: data.question,
          ...(data.handbookPageId !== undefined ? { handbookPageId: data.handbookPageId } : {}),
        },
      },
      included: [],
    };
  }

  /**
   * The envelope `PATCH /handbookthreads/:id` accepts. A dedicated method
   * rather than a branch inside `createJsonApi`: the rename sends the title and
   * nothing else, while a create sends the question and nothing else, and the
   * service must never hand-build either.
   */
  createRenameJsonApi(params: { id: string; title: string }) {
    return {
      data: {
        type: Modules.HandbookThread.name,
        id: params.id,
        attributes: {
          title: params.title,
        },
      },
      included: [],
    };
  }
}
