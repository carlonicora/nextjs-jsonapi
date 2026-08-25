import { describe, expect, it } from "vitest";
import { resolvePhysicalSide } from "../direction";

describe("resolvePhysicalSide", () => {
  it("maps start/end by direction", () => {
    expect(resolvePhysicalSide("start", "ltr")).toBe("left");
    expect(resolvePhysicalSide("start", "rtl")).toBe("right");
    expect(resolvePhysicalSide("end", "ltr")).toBe("right");
    expect(resolvePhysicalSide("end", "rtl")).toBe("left");
  });
  it("passes physical sides through unchanged in both directions", () => {
    for (const dir of ["ltr", "rtl"] as const) {
      for (const side of ["top", "bottom", "left", "right"] as const) {
        expect(resolvePhysicalSide(side, dir)).toBe(side);
      }
    }
  });
});
