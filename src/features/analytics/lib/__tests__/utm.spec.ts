import { describe, expect, it } from "vitest";
import { readUtm } from "../utm";

describe("readUtm", () => {
  it("reads the utm parameters and ignores everything else", () => {
    expect(readUtm("?utm_source=linkedin&utm_medium=social&utm_campaign=launch&x=1")).toEqual({
      utmSource: "linkedin",
      utmMedium: "social",
      utmCampaign: "launch",
    });
  });

  it("returns an empty object for an empty query string", () => {
    expect(readUtm("")).toEqual({});
  });

  it("truncates a value to 255 characters", () => {
    expect(readUtm("?utm_term=" + "a".repeat(300)).utmTerm).toHaveLength(255);
  });
});
