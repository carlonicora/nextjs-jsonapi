import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AssistantInput, AssistantInterface } from "./AssistantInterface";

export class Assistant extends AbstractApiData implements AssistantInterface {
  private _title?: string;
  private _messageCount?: number;
  private _engine?: string;
  private _boundContentType?: string;
  private _boundContentId?: string;

  get title(): string {
    return this._title ?? "";
  }

  get messageCount(): number {
    return this._messageCount ?? 0;
  }

  get engine(): string | undefined {
    return this._engine;
  }

  get boundContentType(): string | undefined {
    return this._boundContentType;
  }

  get boundContentId(): string | undefined {
    return this._boundContentId;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._title = data.jsonApi.attributes?.title;
    this._engine = data.jsonApi.attributes?.engine;
    const fromMeta = data.jsonApi.meta?.messageCount;
    const fromAttrs = data.jsonApi.attributes?.messageCount;
    this._messageCount = typeof fromMeta === "number" ? fromMeta : typeof fromAttrs === "number" ? fromAttrs : 0;
    // Read the linkage pointer directly instead of `_readIncluded`: the bound
    // resource is not side-loaded on this endpoint and only its {type, id} is
    // needed to know which scope the thread belongs to.
    const contentLinkage = data.jsonApi.relationships?.content?.data;
    const boundContent = Array.isArray(contentLinkage) ? contentLinkage[0] : contentLinkage;
    this._boundContentType = boundContent?.type;
    this._boundContentId = boundContent?.id;
    return this;
  }

  createJsonApi(data: AssistantInput) {
    return {
      data: {
        type: Modules.Assistant.name,
        attributes: {
          // narr8 convention for BlockNote-backed fields: the document travels
          // as a JSON string in the entity's own string attribute, exactly as
          // Npc.description does (`JSON.stringify` out, `JSON.parse` back).
          // The server detects the shape and derives the stored markdown.
          content: data.contentBlocks !== undefined ? JSON.stringify(data.contentBlocks) : data.firstMessage,
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.howToMode !== undefined ? { howToMode: data.howToMode } : {}),
          ...(data.limitToHowToId !== undefined ? { limitToHowToId: data.limitToHowToId } : {}),
        },
        ...(data.boundContent !== undefined
          ? {
              relationships: {
                content: { data: { type: data.boundContent.type, id: data.boundContent.id } },
              },
            }
          : {}),
      },
      included: [],
    };
  }
}
