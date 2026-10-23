import { ApiDataInterface } from "../../../core";
import { BlogAiStatus, BlogTranslationSource } from "../types/blog.constants";
import { BlogCategoryInterface } from "./BlogCategoryInterface";

export type BlogCategoryTranslationInput = {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
};

export interface BlogCategoryTranslationInterface extends ApiDataInterface {
  get language(): string;
  get isOriginal(): boolean;
  get source(): BlogTranslationSource;
  get aiStatus(): BlogAiStatus;
  get name(): string;
  get slug(): string;
  get description(): string | undefined;
  get translatedAt(): Date | undefined;
  get category(): BlogCategoryInterface | undefined;
}
