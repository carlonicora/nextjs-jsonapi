import { describe, expect, it } from "vitest";
import { HandbookSection } from "./HandbookSection";

describe("HandbookSection", () => {
  it("rehydrates every attribute", () => {
    const section = new HandbookSection().rehydrate({
      jsonApi: {
        type: "handbooksections",
        id: "s1",
        attributes: { key: "03-backend", title: "Backend", summary: "The API.", order: "03-backend" },
      },
      included: [],
    } as any);

    expect(section.key).toBe("03-backend");
    expect(section.title).toBe("Backend");
    expect(section.summary).toBe("The API.");
    expect(section.order).toBe("03-backend");
  });

  it("defaults missing strings and leaves summary undefined", () => {
    const section = new HandbookSection().rehydrate({
      jsonApi: { type: "handbooksections", id: "s1", attributes: {} },
      included: [],
    } as any);

    expect(section.key).toBe("");
    expect(section.title).toBe("");
    expect(section.summary).toBeUndefined();
    expect(section.displayTitle).toBeUndefined();
    expect(section.displaySummary).toBeUndefined();
  });

  it("rehydrates the translation beside the English original, leaving the key alone", () => {
    const section = new HandbookSection().rehydrate({
      jsonApi: {
        type: "handbooksections",
        id: "s1",
        attributes: {
          key: "03-backend",
          title: "Backend",
          summary: "The API.",
          order: "03-backend",
          displayTitle: "Backend (API)",
          displaySummary: "Le API.",
        },
      },
      included: [],
    } as any);

    expect(section.displayTitle).toBe("Backend (API)");
    expect(section.displaySummary).toBe("Le API.");
    // `key` and `order` are what pages are matched and sorted by; they stay
    // English whatever the translation says.
    expect(section.key).toBe("03-backend");
    expect(section.order).toBe("03-backend");
  });
});
