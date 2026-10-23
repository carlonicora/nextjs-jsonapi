import { beforeAll, describe, expect, it } from "vitest";
import { User } from "../../user/data/user";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../permissions/types";
import {
  BlogCategoryModule,
  BlogCategoryTranslationModule,
  BlogPostModule,
  BlogPostTranslationModule,
} from "../BlogModules";
import { BlogCategory } from "../data/BlogCategory";
import { BlogPost } from "../data/BlogPost";
import { toPublicBlogCategory, toPublicBlogPost } from "./toPublic";

const moduleFactory: ModuleFactory = (params) =>
  ({
    pageUrl: params.pageUrl,
    name: params.name,
    model: params.model,
  }) as ModuleWithPermissions;

beforeAll(() => {
  ModuleRegistry.register("BlogPost", BlogPostModule(moduleFactory));
  ModuleRegistry.register("BlogPostTranslation", BlogPostTranslationModule(moduleFactory));
  ModuleRegistry.register("BlogCategory", BlogCategoryModule(moduleFactory));
  ModuleRegistry.register("BlogCategoryTranslation", BlogCategoryTranslationModule(moduleFactory));
  ModuleRegistry.register("User", { name: "users", model: User } as ModuleWithPermissions);
});

const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Hello", styles: {} }] }];

const makePost = () =>
  new BlogPost().rehydrate({
    jsonApi: {
      id: "p",
      type: "blog-posts",
      attributes: {
        status: "published",
        originalLanguage: "en",
        publishedAt: "2026-10-12T09:00:00.000Z",
        language: "en",
        title: "Prep situations",
        slug: "prep-situations",
        summary: "What to prepare.",
        body: JSON.stringify(blocks),
        readingMinutes: 4,
        authorName: "Ada",
        categoryIds: ["c1"],
      },
      meta: { createdAt: "2026-10-10T09:00:00.000Z", updatedAt: "2026-10-14T09:00:00.000Z" },
    },
    included: [],
  } as any);

describe("toPublicBlogPost", () => {
  it("toPublicBlogPost maps a rehydrated post to plain serialisable data", () => {
    expect(JSON.parse(JSON.stringify(toPublicBlogPost(makePost())))).toEqual(toPublicBlogPost(makePost()));
    expect(toPublicBlogPost(makePost()).publishedAt).toBe("2026-10-12T09:00:00.000Z");
  });

  it("carries the resolved fields", () => {
    const result = toPublicBlogPost(makePost());
    expect(result).toMatchObject({
      id: "p",
      language: "en",
      title: "Prep situations",
      slug: "prep-situations",
      summary: "What to prepare.",
      readingMinutes: 4,
      updatedAt: "2026-10-14T09:00:00.000Z",
      authorName: "Ada",
      categoryIds: ["c1"],
    });
    expect(result.body).toEqual(blocks);
  });
});

describe("toPublicBlogCategory", () => {
  it("maps the resolved name and slug", () => {
    const category = new BlogCategory().rehydrate({
      jsonApi: {
        id: "c1",
        type: "blog-categories",
        attributes: { originalLanguage: "en", name: "Game prep", slug: "game-prep" },
      },
      included: [],
    } as any);

    expect(toPublicBlogCategory(category)).toEqual({ id: "c1", name: "Game prep", slug: "game-prep" });
  });
});
