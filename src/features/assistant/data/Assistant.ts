import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AssistantInput, AssistantInterface } from "./AssistantInterface";

export class Assistant extends AbstractApiData implements AssistantInterface {
  private _title?: string;
  private _messageCount?: number;

  get title(): string {
    return this._title ?? "";
  }

  get messageCount(): number {
    return this._messageCount ?? 0;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._title = data.jsonApi.attributes?.title;
    const fromMeta = data.jsonApi.meta?.messageCount;
    const fromAttrs = data.jsonApi.attributes?.messageCount;
    this._messageCount = typeof fromMeta === "number" ? fromMeta : typeof fromAttrs === "number" ? fromAttrs : 0;
    return this;
  }

  createJsonApi(data: AssistantInput) {
    return {
      data: {
        type: Modules.Assistant.name,
        attributes: {
          content: data.firstMessage,
          ...(data.title !== undefined ? { title: data.title } : {}),
        },
      },
      included: [],
    };
  }
}
