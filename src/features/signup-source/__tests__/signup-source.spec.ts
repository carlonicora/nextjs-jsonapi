import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SignupSourceModule = typeof import("../signup-source");

let cookieStore: Record<string, string>;
let cookieWrites: string[];

function stubBrowser(params: { href: string; referrer?: string }) {
  const url = new URL(params.href);
  vi.stubGlobal("window", { location: { href: url.href, host: url.host } });
  vi.stubGlobal("document", {
    referrer: params.referrer ?? "",
    get cookie() {
      return Object.entries(cookieStore)
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    },
    set cookie(cookieString: string) {
      cookieWrites.push(cookieString);
      const [nameValue] = cookieString.split(";");
      const separator = nameValue.indexOf("=");
      cookieStore[nameValue.slice(0, separator).trim()] = nameValue.slice(separator + 1);
    },
  });
}

async function loadModule(): Promise<SignupSourceModule> {
  return import("../signup-source");
}

describe("signup-source", () => {
  beforeEach(() => {
    vi.resetModules();
    cookieStore = {};
    cookieWrites = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("readSignupSourceFromLocation()", () => {
    it("reads the ref param and the landing path", async () => {
      const { readSignupSourceFromLocation } = await loadModule();
      expect(
        readSignupSourceFromLocation({ url: "https://wyrd.li/?ref=discord-embed", referrer: "", ownHost: "wyrd.li" }),
      ).toEqual({ sourceRef: "discord-embed", sourceLandingPath: "/" });
    });

    it("reads the UTM params", async () => {
      const { readSignupSourceFromLocation } = await loadModule();
      expect(
        readSignupSourceFromLocation({
          url: "https://wyrd.li/it/pricing?utm_source=reddit&utm_medium=social&utm_campaign=r_rpg",
          referrer: "",
          ownHost: "wyrd.li",
        }),
      ).toEqual({
        sourceUtmSource: "reddit",
        sourceUtmMedium: "social",
        sourceUtmCampaign: "r_rpg",
        sourceLandingPath: "/it/pricing",
      });
    });

    it("keeps the host of an external referrer", async () => {
      const { readSignupSourceFromLocation } = await loadModule();
      const source = readSignupSourceFromLocation({
        url: "https://wyrd.li/",
        referrer: "https://www.enworld.org/threads/1",
        ownHost: "wyrd.li",
      });
      expect(source?.sourceReferrer).toBe("www.enworld.org");
    });

    it("returns undefined for an own-host referrer and no params", async () => {
      const { readSignupSourceFromLocation } = await loadModule();
      expect(
        readSignupSourceFromLocation({
          url: "https://wyrd.li/",
          referrer: "https://wyrd.li/pricing",
          ownHost: "wyrd.li",
        }),
      ).toBeUndefined();
    });

    it("truncates values to 200 characters", async () => {
      const { readSignupSourceFromLocation } = await loadModule();
      const source = readSignupSourceFromLocation({
        url: `https://wyrd.li/?ref=${"a".repeat(500)}`,
        referrer: "",
        ownHost: "wyrd.li",
      });
      expect(source?.sourceRef).toHaveLength(200);
    });
  });

  describe("captureSignupSource()", () => {
    it("persist false never writes the cookie", async () => {
      stubBrowser({ href: "https://wyrd.li/?ref=x" });
      const { captureSignupSource, getSignupSource } = await loadModule();

      captureSignupSource({ persist: false });

      expect(getSignupSource()).toEqual({ sourceRef: "x", sourceLandingPath: "/" });
      expect(document.cookie).not.toContain("signup_source");
      expect(cookieWrites).toHaveLength(0);
    });

    it("persist true writes the cookie once", async () => {
      stubBrowser({ href: "https://wyrd.li/?ref=x" });
      const { captureSignupSource } = await loadModule();

      captureSignupSource({ persist: true });
      captureSignupSource({ persist: true });

      expect(cookieWrites).toHaveLength(1);
      expect(cookieWrites[0]).toContain("signup_source=");
      expect(cookieWrites[0]).toContain("max-age=2592000");
      expect(cookieWrites[0]).toContain("SameSite=Lax");
      expect(cookieWrites[0]).toContain("path=/");
    });

    it("first touch wins over an existing cookie", async () => {
      cookieStore["signup_source"] = encodeURIComponent(JSON.stringify({ sourceRef: "discord-embed" }));
      stubBrowser({ href: "https://wyrd.li/?utm_source=reddit" });
      const { captureSignupSource, getSignupSource } = await loadModule();

      captureSignupSource({ persist: true });

      expect(getSignupSource()?.sourceRef).toBe("discord-embed");
      expect(getSignupSource()?.sourceUtmSource).toBeUndefined();
      expect(cookieWrites).toHaveLength(0);
    });

    it("a later persist=true writes the in-memory value", async () => {
      stubBrowser({ href: "https://wyrd.li/?ref=x" });
      const { captureSignupSource } = await loadModule();

      captureSignupSource({ persist: false });
      expect(cookieWrites).toHaveLength(0);

      stubBrowser({ href: "https://wyrd.li/pricing" });
      captureSignupSource({ persist: true });

      expect(cookieWrites).toHaveLength(1);
      expect(JSON.parse(decodeURIComponent(cookieStore["signup_source"]))).toEqual({
        sourceRef: "x",
        sourceLandingPath: "/",
      });
    });

    it("treats a malformed cookie as absent", async () => {
      cookieStore["signup_source"] = "not-json%";
      stubBrowser({ href: "https://wyrd.li/" });
      const { getSignupSource } = await loadModule();

      expect(getSignupSource()).toBeUndefined();
    });
  });
});
