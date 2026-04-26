import { ApiDataInterface } from "../../../core";

/**
 * Edge properties on the (:AssistantMessage)-[:CITES]->(:Chunk) relationship.
 * Surfaced via _readIncludedWithMeta on AssistantMessage.citations.
 */
export interface ChunkRelationshipMeta {
  relevance: number;
  reason?: string;
}

export interface ChunkInterface extends ApiDataInterface {
  get content(): string;
  get nodeId(): string | undefined;
  get nodeType(): string | undefined;
  get imagePath(): string | undefined;
  get source(): ApiDataInterface | undefined;
}
