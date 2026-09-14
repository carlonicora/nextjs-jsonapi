import { describe, expect, it } from "vitest";
import {
  handbookPageContent,
  handbookPageSummary,
  handbookPageTitle,
  handbookSectionSummary,
  handbookSectionTitle,
} from "./handbookDisplay";

/**
 * The one rule the whole feature depends on: indexed in English, shown
 * translated, and nothing but the rendered words changes.
 */
describe("handbookDisplay", () => {
  describe("a page with a translation", () => {
    const page = {
      title: "Module anatomy",
      displayTitle: "Anatomia di un modulo",
      summary: "What a feature module contains.",
      displaySummary: "Cosa contiene un modulo.",
      content: "# Module anatomy\n",
      displayContent: "# Anatomia di un modulo\n",
    };

    it("renders the translated title", () => {
      expect(handbookPageTitle(page)).toBe("Anatomia di un modulo");
    });

    it("renders the translated summary", () => {
      expect(handbookPageSummary(page)).toBe("Cosa contiene un modulo.");
    });

    it("renders the translated body", () => {
      expect(handbookPageContent(page)).toBe("# Anatomia di un modulo\n");
    });
  });

  describe("a page without a translation", () => {
    const page = {
      title: "Module anatomy",
      displayTitle: undefined,
      summary: "What a feature module contains.",
      displaySummary: undefined,
      content: "# Module anatomy\n",
      displayContent: undefined,
    };

    it("falls back to the English title", () => {
      expect(handbookPageTitle(page)).toBe("Module anatomy");
    });

    it("falls back to the English summary", () => {
      expect(handbookPageSummary(page)).toBe("What a feature module contains.");
    });

    it("falls back to the English body", () => {
      expect(handbookPageContent(page)).toBe("# Module anatomy\n");
    });

    it("leaves a summary that exists in neither language undefined", () => {
      expect(handbookPageSummary({ summary: undefined, displaySummary: undefined })).toBeUndefined();
    });
  });

  describe("sections", () => {
    it("renders the translated title and summary when there is one", () => {
      const section = {
        title: "Backend",
        displayTitle: "Backend (API)",
        summary: "The API.",
        displaySummary: "Le API.",
      };
      expect(handbookSectionTitle(section)).toBe("Backend (API)");
      expect(handbookSectionSummary(section)).toBe("Le API.");
    });

    it("falls back to English when there is none", () => {
      const section = { title: "Backend", displayTitle: undefined, summary: "The API.", displaySummary: undefined };
      expect(handbookSectionTitle(section)).toBe("Backend");
      expect(handbookSectionSummary(section)).toBe("The API.");
    });
  });

  /**
   * An empty string is a translation the ingest wrote, not a missing one, so
   * `??` is the correct operator and `||` would be wrong: the fallback must
   * only fire on `undefined`.
   */
  it("treats an empty translation as a translation", () => {
    expect(handbookPageTitle({ title: "Module anatomy", displayTitle: "" })).toBe("");
  });
});
