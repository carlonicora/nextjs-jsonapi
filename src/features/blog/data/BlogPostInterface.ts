import { ApiDataInterface } from "../../../core";
import { UserInterface } from "../../user/data/user.interface";
import { BlogPostStatus } from "../types/blog.constants";
import { BlogCategoryInterface } from "./BlogCategoryInterface";
import { BlogPostTranslationInterface } from "./BlogPostTranslationInterface";

export type BlogPostInput = {
  id: string;
  originalLanguage?: string;
  title?: string;
  slug?: string;
  summary?: string;
  body?: any;
  coverImage?: string;
  coverImageAlt?: string;
  categoryIds?: string[];
};

export interface BlogPostInterface extends ApiDataInterface {
  get status(): BlogPostStatus;
  get originalLanguage(): string;
  get coverImage(): string | undefined;
  get publishedAt(): Date | undefined;
  get author(): UserInterface | undefined;
  get categories(): BlogCategoryInterface[];
  get translations(): BlogPostTranslationInterface[];
  get original(): BlogPostTranslationInterface | undefined;

  // Resolved for one language by the public and list queries.
  get language(): string | undefined;
  get title(): string | undefined;
  get slug(): string | undefined;
  get summary(): string | undefined;
  get body(): any;
  get coverImageAlt(): string | undefined;
  get readingMinutes(): number | undefined;
  get authorName(): string | undefined;
  get categoryIds(): string[];
}
