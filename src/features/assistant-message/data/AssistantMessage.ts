import { AbstractApiData, ApiDataInterface, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AssistantMessageInput, AssistantMessageInterface, AssistantMessageRole } from "./AssistantMessageInterface";
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

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    const attrs = data.jsonApi.attributes ?? {};
    this._role = attrs.role as AssistantMessageRole | undefined;
    this._content = attrs.content;
    this._position = typeof attrs.position === "number" ? attrs.position : Number(attrs.position ?? 0);
    this._suggestedQuestions = Array.isArray(attrs.suggestedQuestions) ? attrs.suggestedQuestions : [];
    this._inputTokens = attrs.inputTokens;
    this._outputTokens = attrs.outputTokens;
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

  static buildOptimistic(params: { content: string; position: number; assistantId?: string }): AssistantMessage {
    const msg = new AssistantMessage();
    const jsonApi: Record<string, unknown> = {
      id: `tmp-${crypto.randomUUID()}`,
      type: Modules.AssistantMessage.name,
      attributes: {
        role: "user",
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
    return msg;
  }
}
