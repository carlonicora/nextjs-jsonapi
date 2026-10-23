import { beforeAll, describe, expect, it } from "vitest";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../permissions/types";
import { BlogPostModule, BlogPostTranslationModule } from "../BlogModules";
import { BlogPostTranslation } from "./BlogPostTranslation";

const moduleFactory: ModuleFactory = (params) =>
  ({
    pageUrl: params.pageUrl,
    name: params.name,
    model: params.model,
  }) as ModuleWithPermissions;

beforeAll(() => {
  ModuleRegistry.register("BlogPost", BlogPostModule(moduleFactory));
  ModuleRegistry.register("BlogPostTranslation", BlogPostTranslationModule(moduleFactory));
});

const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Ciao", styles: {} }] }];

describe("BlogPostTranslation", () => {
  it("BlogPostTranslation.rehydrate exposes source, aiStatus and translatedAt as Date", () => {
    const translation = new BlogPostTranslation().rehydrate({
      jsonApi: {
        id: "t",
        type: "blog-post-translations",
        attributes: {
          language: "it",
          isOriginal: false,
          source: "manual",
          aiStatus: "completed",
          title: "Titolo",
          slug: "titolo",
          body: JSON.stringify(blocks),
          readingMinutes: 2,
          translatedAt: "2026-10-12T09:00:00.000Z",
        },
      },
      included: [],
    } as any);

    expect(translation.language).toBe("it");
    expect(translation.isOriginal).toBe(false);
    expect(translation.source).toBe("manual");
    expect(translation.aiStatus).toBe("completed");
    expect(translation.translatedAt).toBeInstanceOf(Date);
    expect(translation.translatedAt?.toISOString()).toBe("2026-10-12T09:00:00.000Z");
    expect(translation.body).toEqual(blocks);
    expect(translation.readingMinutes).toBe(2);
  });

  it("a pending placeholder has no text and no translatedAt", () => {
    const translation = new BlogPostTranslation().rehydrate({
      jsonApi: {
        id: "t",
        type: "blog-post-translations",
        attributes: { language: "it", isOriginal: false, source: "ai", aiStatus: "pending" },
      },
      included: [],
    } as any);

    expect(translation.aiStatus).toBe("pending");
    expect(translation.title).toBe("");
    expect(translation.body).toEqual([]);
    expect(translation.translatedAt).toBeUndefined();
  });

  it("createJsonApi stringifies the body and sends only the editable fields", () => {
    const payload = new BlogPostTranslation().createJsonApi({ id: "t", title: "Titolo", body: blocks });
    expect(payload.data.type).toBe("blog-post-translations");
    expect(payload.data.attributes).toEqual({ title: "Titolo", body: JSON.stringify(blocks) });
  });
});
