import { describe, expect, it } from "vitest";
import { findViolations } from "./check-rtl-classes.mjs";

const hits = (src: string) => findViolations(src, "x.tsx").map((v) => v.match);

describe("check-rtl-classes", () => {
  it("flags physical directional utilities", () => {
    expect(hits(`<div className="ml-2 pr-4 text-left rounded-l-md border-r left-0 -right-4" />`)).toHaveLength(7);
    expect(hits(`<li style={{ paddingLeft: "1rem" }} />`)).toHaveLength(1);
  });
  it("ignores logical, symmetric, compound and rtl-variant classes", () => {
    expect(
      hits(
        `<div className="ms-2 pe-4 text-start rounded-s-md border-e start-0 inset-x-2 space-x-2 divide-x translate-x-1/2 slide-in-from-left-10 rounded-lg border-x blur-md rtl:rotate-180 rtl:-translate-x-2 data-[side=left]:left-0" />`,
      ),
    ).toHaveLength(0);
  });
  it("honours rtl-ok escapes on the same or previous line", () => {
    expect(hits(`{/* rtl-ok */}\n<div className="ml-2" />`)).toHaveLength(0);
    expect(hits(`<div className="ml-2" /> {/* rtl-ok */}`)).toHaveLength(0);
  });
  it("skips test files", () => {
    expect(findViolations(`"ml-2"`, "src/x/__tests__/y.test.tsx")).toHaveLength(0);
  });
});
