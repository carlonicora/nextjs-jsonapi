import { beforeAll, describe, expect, it } from "vitest";
import { User } from "../../user/data/user";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../permissions/types";
import {
  BlogCategoryModule,
  BlogCategoryTranslationModule,
  BlogPostModule,
  BlogPostTranslationModule,
  BlogSettingsModule,
} from "../BlogModules";
import { BlogPost } from "./BlogPost";
import { BlogPostTranslation } from "./BlogPostTranslation";
import { BlogCategory } from "./BlogCategory";
import { DataClassRegistry } from "../../../core/registry/DataClassRegistry";
import { Modules } from "../../../core/registry/ModuleRegistry";

// createJsonApi reads Modules.X.name (resolved lazily via ModuleRegistry), so
// the modules must be registered before a model serialises — mirrors the
// email-automation-models.spec setup convention in this package.
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
  ModuleRegistry.register("BlogSettings", BlogSettingsModule(moduleFactory));
  ModuleRegistry.register("User", { name: "users", model: User } as ModuleWithPermissions);
  DataClassRegistry.registerObjectClass(Modules.BlogPostTranslation, BlogPostTranslation);
  DataClassRegistry.registerObjectClass(Modules.BlogCategory, BlogCategory);
  DataClassRegistry.registerObjectClass(Modules.User, User);
});

const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Hello", styles: {} }] }];

describe("BlogPost", () => {
  it("BlogPost.createJsonApi stringifies the body and sends categories", () => {
    const p = new BlogPost().createJsonApi({
      id: "p",
      originalLanguage: "en",
      title: "T",
      body: [{ type: "paragraph" }],
      categoryIds: ["c1"],
    });
    expect(p.data.type).toBe("blog-posts");
    expect(typeof p.data.attributes.body).toBe("string");
    expect(JSON.parse(p.data.attributes.body)).toEqual([{ type: "paragraph" }]);
    expect(p.data.relationships.categories.data).toEqual([{ type: "blog-categories", id: "c1" }]);
  });

  it("never sends server-owned attributes", () => {
    const p = new BlogPost().createJsonApi({ id: "p", title: "T" });
    expect(p.data.attributes).toEqual({ title: "T" });
    expect("categories" in p.data.relationships).toBe(false);
  });

  it("BlogPost.rehydrate parses publishedAt as a Date and the resolved body as blocks", () => {
    const post = new BlogPost().rehydrate({
      jsonApi: {
        id: "p",
        type: "blog-posts",
        attributes: {
          status: "published",
          originalLanguage: "en",
          publishedAt: "2026-10-12T09:00:00.000Z",
          language: "it",
          title: "Titolo",
          slug: "titolo",
          body: JSON.stringify(blocks),
          readingMinutes: 3,
          authorName: "Ada",
          categoryIds: ["c1"],
        },
        relationships: {
          translations: { data: [{ type: "blog-post-translations", id: "t1" }] },
        },
      },
      included: [
        {
          id: "t1",
          type: "blog-post-translations",
          attributes: { language: "en", isOriginal: true, source: "original", aiStatus: "completed", title: "Title" },
        },
      ],
    } as any);

    expect(post.publishedAt).toBeInstanceOf(Date);
    expect(post.publishedAt?.toISOString()).toBe("2026-10-12T09:00:00.000Z");
    expect(Array.isArray(post.body)).toBe(true);
    expect(post.body).toEqual(blocks);
    expect(post.status).toBe("published");
    expect(post.language).toBe("it");
    expect(post.title).toBe("Titolo");
    expect(post.readingMinutes).toBe(3);
    expect(post.authorName).toBe("Ada");
    expect(post.categoryIds).toEqual(["c1"]);
    expect(post.translations).toHaveLength(1);
    expect(post.original?.title).toBe("Title");
  });

  it("reads resolved values sent as meta", () => {
    const post = new BlogPost().rehydrate({
      jsonApi: {
        id: "p",
        type: "blog-posts",
        attributes: { status: "draft", originalLanguage: "en" },
        meta: { title: "From meta", categoryIds: ["c2"] },
      },
      included: [],
    } as any);

    expect(post.title).toBe("From meta");
    expect(post.categoryIds).toEqual(["c2"]);
    expect(post.publishedAt).toBeUndefined();
    expect(post.body).toEqual([]);
  });
});
