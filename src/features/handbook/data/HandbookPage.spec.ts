import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { HandbookPage } from "./HandbookPage";

// createJsonApi reads Modules.HandbookPage.name (resolved lazily via
// ModuleRegistry), so the module must be registered before the model
// serialises — mirrors the HowTo.spec setup convention in this package.
const handbookPageModule: ApiRequestDataTypeInterface = {
  name: "handbookpages",
  model: HandbookPage,
} as any;

beforeAll(() => {
  ModuleRegistry.register("HandbookPage", handbookPageModule);
});

describe("HandbookPage", () => {
  it("rehydrates every attribute", () => {
    const page = new HandbookPage().rehydrate({
      jsonApi: {
        id: "id-1",
        type: "handbookpages",
        attributes: {
          path: "03-backend/module-anatomy.md",
          title: "Module anatomy",
          content: "# Module anatomy",
          contentHash: "abc",
          wordCount: 3,
          aiStatus: "completed",
        },
      },
    } as any);

    expect(page.path).toBe("03-backend/module-anatomy.md");
    expect(page.title).toBe("Module anatomy");
    expect(page.content).toBe("# Module anatomy");
    expect(page.contentHash).toBe("abc");
    expect(page.wordCount).toBe(3);
    expect(page.aiStatus).toBe("completed");
  });

  it("defaults a missing word count to zero and a missing status to undefined", () => {
    const page = new HandbookPage().rehydrate({
      jsonApi: {
        id: "id-1",
        type: "handbookpages",
        attributes: { path: "a.md", title: "A", content: "#A", contentHash: "h" },
      },
    } as any);

    expect(page.wordCount).toBe(0);
    expect(page.aiStatus).toBeUndefined();
  });

  it("creates an identity-only JSON:API payload", () => {
    const payload = new HandbookPage().createJsonApi({ id: "id-1" });
    expect(payload.data.type).toBe("handbookpages");
    expect(payload.data.id).toBe("id-1");
    expect(payload.data.attributes).toEqual({});
  });

  it("rehydrates section, order and summary", () => {
    const page = new HandbookPage().rehydrate({
      jsonApi: {
        type: "handbookpages",
        id: "p1",
        attributes: {
          path: "03-backend/testing.md",
          title: "Testing the API",
          section: "03-backend",
          order: "03-backend/testing.md",
          summary: "The spec layout and what is mocked.",
        },
      },
      included: [],
    } as any);

    expect(page.section).toBe("03-backend");
    expect(page.order).toBe("03-backend/testing.md");
    expect(page.summary).toBe("The spec layout and what is mocked.");
  });

  it("returns undefined for a missing summary", () => {
    const page = new HandbookPage().rehydrate({
      jsonApi: { type: "handbookpages", id: "p1", attributes: { title: "X" } },
      included: [],
    } as any);
    expect(page.summary).toBeUndefined();
  });

  it("rehydrates the translation that travels beside the English original", () => {
    const page = new HandbookPage().rehydrate({
      jsonApi: {
        type: "handbookpages",
        id: "p1",
        attributes: {
          path: "03-backend/testing.md",
          title: "Testing the API",
          summary: "The spec layout and what is mocked.",
          content: "# Testing the API",
          displayTitle: "Testare le API",
          displaySummary: "Come sono organizzati gli spec.",
          displayContent: "# Testare le API",
        },
      },
      included: [],
    } as any);

    // The translation lives on the SAME node, matched by `path` at ingest
    // time: no second id, no locale in the payload.
    expect(page.id).toBe("p1");
    expect(page.displayTitle).toBe("Testare le API");
    expect(page.displaySummary).toBe("Come sono organizzati gli spec.");
    expect(page.displayContent).toBe("# Testare le API");
    // The English original is still there, and `path` is untouched: ordering
    // and grouping read it and must not move.
    expect(page.title).toBe("Testing the API");
    expect(page.path).toBe("03-backend/testing.md");
  });

  it("leaves an untranslated page's display fields undefined", () => {
    const page = new HandbookPage().rehydrate({
      jsonApi: {
        type: "handbookpages",
        id: "p1",
        attributes: { title: "Testing the API", summary: "S", content: "# C" },
      },
      included: [],
    } as any);

    expect(page.displayTitle).toBeUndefined();
    expect(page.displaySummary).toBeUndefined();
    expect(page.displayContent).toBeUndefined();
  });
});
