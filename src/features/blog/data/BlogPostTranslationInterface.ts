import { ApiDataInterface } from "../../../core";
import { BlogAiStatus, BlogTranslationSource } from "../types/blog.constants";
import { BlogPostInterface } from "./BlogPostInterface";

export type BlogPostTranslationInput = {
  id: string;
  title?: string;
  slug?: string;
  summary?: string;
  body?: any;
  coverImageAlt?: string;
};

export interface BlogPostTranslationInterface extends ApiDataInterface {
  get language(): string;
  get isOriginal(): boolean;
  get source(): BlogTranslationSource;
  get aiStatus(): BlogAiStatus;
  get title(): string;
  get slug(): string;
  get summary(): string | undefined;
  get body(): any;
  get coverImageAlt(): string | undefined;
  get readingMinutes(): number;
  get translatedAt(): Date | undefined;
  get post(): BlogPostInterface | undefined;
}
