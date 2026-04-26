import { AbstractApiData, ApiDataInterface, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { resolveReferenceableModules } from "../../assistant/utils/resolveReferenceableModules";
import { ChunkInterface } from "./ChunkInterface";

export class Chunk extends AbstractApiData implements ChunkInterface {
  private _content?: string;
  private _nodeId?: string;
  private _nodeType?: string;
  private _imagePath?: string;
  private _source?: ApiDataInterface;

  get content(): string {
    return this._content ?? "";
  }
  get nodeId(): string | undefined {
    return this._nodeId;
  }
  get nodeType(): string | undefined {
    return this._nodeType;
  }
  get imagePath(): string | undefined {
    return this._imagePath;
  }
  get source(): ApiDataInterface | undefined {
    return this._source;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    const attrs = data.jsonApi.attributes ?? {};
    const meta = data.jsonApi.meta ?? {};
    this._content = attrs.content;
    this._nodeId = meta.nodeId ?? attrs.nodeId;
    this._nodeType = meta.nodeType ?? attrs.nodeType;
    this._imagePath = attrs.imagePath;

    const src = this._readIncludedPolymorphic<ApiDataInterface>(data, "source", resolveReferenceableModules());
    this._source = Array.isArray(src) ? src[0] : src;
    return this;
  }

  createJsonApi() {
    // Chunks are read-only from the assistant context. Provide a minimal stub.
    return {
      data: { type: Modules.Chunk.name, id: this.id, attributes: {}, relationships: {} },
      included: [],
    };
  }
}
