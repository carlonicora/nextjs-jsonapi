import { v4 as uuidv4 } from "uuid";
import { AbstractApiData, ApiDataInterface, JsonApiHydratedDataInterface, Modules } from "../../../core";
import {
  AssistantMessageInput,
  AssistantMessageInterface,
  AssistantMessageRole,
  AssistantMessageType,
} from "./AssistantMessageInterface";
import { resolveReferenceableModules } from "../../assistant/utils/resolveReferenceableModules";
import { ChunkInterface, ChunkRelationshipMeta } from "../../chunk/data/ChunkInterface";

export class AssistantMessage extends AbstractApiData implements AssistantMessageInterface {
  private _role?: AssistantMessageRole;
  private _content?: string;
  private _position?: number;
  private _suggestedQuestions?: string[];
  private _inputTokens?: number;
  private _outputTokens?: number;
  private _references?: ApiDataInterface[];
  private _citations?: (ChunkInterface & ChunkRelationshipMeta)[];
  private _isOptimistic = false;
  private _messageType?: AssistantMessageType;
  private _actionId?: string;

  get role(): AssistantMessageRole {
    return this._role ?? "assistant";
  }

  get content(): string {
    return this._content ?? "";
  }

  get position(): number {
    return this._position ?? 0;
  }

  get suggestedQuestions(): string[] {
    return this._suggestedQuestions ?? [];
  }

  get inputTokens(): number | undefined {
    return this._inputTokens;
  }

  get outputTokens(): number | undefined {
    return this._outputTokens;
  }

  get references(): ApiDataInterface[] {
    return this._references ?? [];
  }

  get citations(): (ChunkInterface & ChunkRelationshipMeta)[] {
    return this._citations ?? [];
  }

  get isOptimistic(): boolean {
    return this._isOptimistic;
  }

  get messageType(): AssistantMessageType {
    return this._messageType ?? "text";
  }

  get actionId(): string | undefined {
    return this._actionId;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    const attrs = data.jsonApi.attributes ?? {};
    this._role = attrs.role as AssistantMessageRole | undefined;
    this._content = attrs.content;
    this._position = typeof attrs.position === "number" ? attrs.position : Number(attrs.position ?? 0);
    this._suggestedQuestions = Array.isArray(attrs.suggestedQuestions) ? attrs.suggestedQuestions : [];
    this._inputTokens = attrs.inputTokens;
    this._outputTokens = attrs.outputTokens;
    this._messageType = attrs.messageType as AssistantMessageType | undefined;
    // The AssistantAction module is app-registered, so only the raw
    // relationship id is exposed (no hydration of the included resource here).
    const actionRelationship = data.jsonApi.relationships?.action?.data;
    this._actionId = Array.isArray(actionRelationship) ? actionRelationship[0]?.id : actionRelationship?.id;
    const refs = this._readIncludedPolymorphic<ApiDataInterface>(data, "references", resolveReferenceableModules());
    this._references = Array.isArray(refs) ? refs : refs ? [refs] : [];
    if (data.jsonApi.relationships?.citations?.data) {
      const citations = this._readIncludedWithMeta<ChunkInterface, ChunkRelationshipMeta>(
        data,
        "citations",
        Modules.Chunk,
      );
      this._citations = Array.isArray(citations)
        ? (citations as (ChunkInterface & ChunkRelationshipMeta)[])
        : citations
          ? [citations as ChunkInterface & ChunkRelationshipMeta]
          : [];
    } else {
      this._citations = [];
    }
    return this;
  }

  createJsonApi(data: AssistantMessageInput) {
    return {
      data: {
        type: Modules.AssistantMessage.name,
        id: data.id,
        attributes: {
          role: data.role,
          content: data.content,
          position: data.position,
        },
        relationships: {
          assistant: {
            data: { type: Modules.Assistant.name, id: data.assistantId },
          },
        },
      },
      included: [],
    };
  }

  /**
   * JSON:API envelope for POST /assistants/:id/assistant-messages.
   * Different from `createJsonApi` (which expects a full message with role/position/assistant ref);
   * the append-to-thread endpoint derives those server-side, so we only send `content` and
   * the optional retrieval-mode flags.
   */
  createAppendMessageJsonApi(params: {
    content: string;
    howToMode?: boolean;
    limitToHowToId?: string;
    handbookMode?: boolean;
    limitToHandbookPageId?: string;
    contentBlocks?: unknown[];
  }) {
    return {
      data: {
        type: Modules.AssistantMessage.name,
        attributes: {
          // narr8 convention for BlockNote-backed fields: the document travels
          // as a JSON string in the field's own string attribute (see
          // Npc.description). The server detects the shape and derives the
          // stored markdown from it.
          content: params.contentBlocks !== undefined ? JSON.stringify(params.contentBlocks) : params.content,
          ...(params.howToMode !== undefined ? { howToMode: params.howToMode } : {}),
          ...(params.limitToHowToId !== undefined ? { limitToHowToId: params.limitToHowToId } : {}),
          ...(params.handbookMode !== undefined ? { handbookMode: params.handbookMode } : {}),
          ...(params.limitToHandbookPageId !== undefined
            ? { limitToHandbookPageId: params.limitToHandbookPageId }
            : {}),
        },
      },
    };
  }

  static buildOptimistic(params: { content: string; position: number; assistantId?: string }): AssistantMessage {
    return AssistantMessage.buildLocal({ ...params, role: "user", isOptimistic: true });
  }

  /**
   * A message that exists only on the client, for a surface that renders the
   * chat presentation without persisting a thread.
   *
   * `buildOptimistic` is the user-turn case and delegates here. The handbook
   * ask surface is the other caller: it has no Assistant and no stored
   * messages, but it renders through MessageList/MessageItem like every other
   * chat in the product, so it needs both roles.
   */
  static buildLocal(params: {
    role: AssistantMessageRole;
    content: string;
    position: number;
    assistantId?: string;
    isOptimistic?: boolean;
  }): AssistantMessage {
    const msg = new AssistantMessage();
    const jsonApi: Record<string, unknown> = {
      id: uuidv4(),
      type: Modules.AssistantMessage.name,
      attributes: {
        role: params.role,
        content: params.content,
        position: params.position,
      },
    };
    if (params.assistantId) {
      jsonApi.relationships = {
        assistant: { data: { type: Modules.Assistant.name, id: params.assistantId } },
      };
    }
    msg.rehydrate({ jsonApi: jsonApi as any, included: [] });
    msg._isOptimistic = params.isOptimistic ?? false;
    return msg;
  }
}
