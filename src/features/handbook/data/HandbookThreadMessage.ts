import { v4 as uuidv4 } from "uuid";
import { AbstractApiData, ApiDataInterface, JsonApiHydratedDataInterface, Modules } from "../../../core";
import type {
  AssistantMessageRole,
  AssistantMessageType,
} from "../../assistant-message/data/AssistantMessageInterface";
import { ChunkInterface, ChunkRelationshipMeta } from "../../chunk/data/ChunkInterface";
import { HandbookThreadMessageInput, HandbookThreadMessageInterface } from "./HandbookThreadMessageInterface";

/**
 * One persisted handbook turn.
 *
 * The getters below are the structural contract `AssistantMessageInterface`
 * asks for, which is what lets `AssistantThread` render handbook messages with
 * no adapter. The handbook has no token accounting, no entity references, no
 * chunk citations and no approval actions, so those answer `undefined` / `[]`
 * rather than being faked.
 */
export class HandbookThreadMessage extends AbstractApiData implements HandbookThreadMessageInterface {
  private _role?: AssistantMessageRole;
  private _content?: string;
  private _position?: number;
  private _sources?: string[];
  private _isOptimistic = false;

  get role(): AssistantMessageRole {
    return this._role ?? "assistant";
  }

  get content(): string {
    return this._content ?? "";
  }

  get position(): number {
    return this._position ?? 0;
  }

  get sources(): string[] {
    return this._sources ?? [];
  }

  /** The handbook agent returns no follow-ups. */
  get suggestedQuestions(): string[] {
    return [];
  }

  /** Token accounting is not billed against a handbook thread. */
  get inputTokens(): number | undefined {
    return undefined;
  }

  get outputTokens(): number | undefined {
    return undefined;
  }

  /** The handbook answers from pages, never from product entities. */
  get references(): ApiDataInterface[] {
    return [];
  }

  /** Cited pages travel in `sources`, not as Chunk resources. */
  get citations(): (ChunkInterface & ChunkRelationshipMeta)[] {
    return [];
  }

  /** Set only by `buildLocal`; a rehydrated message is always real. */
  get isOptimistic(): boolean {
    return this._isOptimistic;
  }

  /** There is no operator engine behind the handbook, so never an approval request. */
  get messageType(): AssistantMessageType {
    return "text";
  }

  get actionId(): string | undefined {
    return undefined;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};
    this._role = attributes.role as AssistantMessageRole | undefined;
    this._content = attributes.content;
    this._position = typeof attributes.position === "number" ? attributes.position : Number(attributes.position ?? 0);
    this._sources = Array.isArray(attributes.sources) ? attributes.sources : [];

    return this;
  }

  /**
   * The envelope `POST /handbookthreads/:id/handbookthreadmessages` accepts:
   * only the question. Role and position are derived server-side from the
   * thread, and there is no client-chosen id for the pair of messages the turn
   * creates.
   *
   * `handbookPageId` rides the same way `question` does, through this method
   * and never through `overridesJsonApiCreation`. It is written only when the
   * caller supplied it: the DTO takes it as optional, and sending an explicit
   * `null` would fail validation rather than mean "the whole manual".
   */
  createJsonApi(data: HandbookThreadMessageInput) {
    return {
      data: {
        type: Modules.HandbookThreadMessage.name,
        attributes: {
          question: data.question,
          ...(data.handbookPageId !== undefined ? { handbookPageId: data.handbookPageId } : {}),
        },
      },
      included: [],
    };
  }

  /**
   * A message that exists only on the client: the optimistic user turn while
   * the agent runs, and the failure notice when it does not answer. Mirrors
   * `AssistantMessage.buildLocal`, which the stateless handbook surface used
   * before threads existed.
   */
  static buildLocal(params: {
    role: AssistantMessageRole;
    content: string;
    position: number;
    isOptimistic?: boolean;
  }): HandbookThreadMessage {
    const message = new HandbookThreadMessage();
    message.rehydrate({
      jsonApi: {
        id: uuidv4(),
        type: Modules.HandbookThreadMessage.name,
        attributes: {
          role: params.role,
          content: params.content,
          position: params.position,
        },
      } as any,
      included: [],
    });
    message._isOptimistic = params.isOptimistic ?? false;
    return message;
  }
}
