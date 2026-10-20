import { describe, expect, it } from "vitest";
import { formatSignupSource } from "../formatSignupSource";

describe("formatSignupSource", () => {
  it("prefers ref over utm source", () => {
    expect(formatSignupSource({ sourceRef: "discord-embed", sourceUtmSource: "reddit" })).toBe("discord-embed");
  });

  it("joins utm source and campaign", () => {
    expect(formatSignupSource({ sourceUtmSource: "reddit", sourceUtmCampaign: "r_rpg" })).toBe("reddit / r_rpg");
  });

  it("shows utm source alone when there is no campaign", () => {
    expect(formatSignupSource({ sourceUtmSource: "reddit" })).toBe("reddit");
  });

  it("falls back to the referring host", () => {
    expect(formatSignupSource({ sourceReferrer: "enworld.org" })).toBe("enworld.org");
  });

  it("returns undefined for a direct visit", () => {
    expect(formatSignupSource({})).toBeUndefined();
  });
});
