import { describe, expect, it } from "vitest";
import { detailsFitsByDefault } from "../detailsFitsByDefault";

const base = { remPx: 16, hasRail: false, hasCentredColumn: true };

describe("detailsFitsByDefault", () => {
  it("needs column + padding + panel inside the card (1569px)", () => {
    expect(detailsFitsByDefault({ ...base, cardInnerPx: 1569 })).toBe(true);
    expect(detailsFitsByDefault({ ...base, cardInnerPx: 1568 })).toBe(false);
  });

  it("adds the section rail when the page has one (1793px)", () => {
    expect(detailsFitsByDefault({ ...base, hasRail: true, cardInnerPx: 1793 })).toBe(true);
    expect(detailsFitsByDefault({ ...base, hasRail: true, cardInnerPx: 1792 })).toBe(false);
  });

  it("scales with the root font size", () => {
    expect(detailsFitsByDefault({ ...base, remPx: 20, cardInnerPx: 1961 })).toBe(true);
    expect(detailsFitsByDefault({ ...base, remPx: 20, cardInnerPx: 1960 })).toBe(false);
  });

  it("stays closed on pages without a centred column", () => {
    expect(detailsFitsByDefault({ ...base, hasCentredColumn: false, cardInnerPx: 4000 })).toBe(false);
  });
});
