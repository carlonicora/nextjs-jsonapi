import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import {
  AssistantMessageInput,
  AssistantMessageInterface,
  AssistantMessageReference,
  AssistantMessageRole,
} from "./AssistantMessageInterface";

export class AssistantMessage extends AbstractApiData implements AssistantMessageInterface {
  private _role?: AssistantMessageRole;
  private _content?: string;
  private _position?: number;
  private _suggestedQuestions?: string[];
  private _inputTokens?: number;
  private _outputTokens?: number;
  private _references?: AssistantMessageReference[];

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

  get references(): AssistantMessageReference[] {
    return this._references ?? [];
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
    this._references = this.parseReferences(attrs.references);
    return this;
  }

  private parseReferences(raw: unknown): AssistantMessageReference[] {
    if (Array.isArray(raw)) return raw as AssistantMessageReference[];
    if (typeof raw === "string" && raw.length > 0) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as AssistantMessageReference[]) : [];
      } catch {
        return [];
      }
    }
    return [];
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
}
