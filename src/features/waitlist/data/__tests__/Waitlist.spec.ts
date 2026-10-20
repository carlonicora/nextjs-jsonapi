import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { Waitlist } from "../Waitlist";
import { WaitlistInput } from "../WaitlistInterface";

// Waitlist.createJsonApi() resolves Modules.Waitlist through the real ModuleRegistry.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("Waitlist", { name: "waitlists", model: Waitlist } as any);
});

const baseInput: WaitlistInput = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "gm@example.com",
  gdprConsent: true,
  gdprConsentAt: "2026-10-21T10:00:00.000Z",
};

const SOURCE_KEYS = [
  "sourceRef",
  "sourceUtmSource",
  "sourceUtmMedium",
  "sourceUtmCampaign",
  "sourceReferrer",
  "sourceLandingPath",
];

describe("Waitlist.createJsonApi()", () => {
  it("createJsonApi writes the six source attributes when present", () => {
    const payload = new Waitlist().createJsonApi({
      ...baseInput,
      source: {
        sourceRef: "discord-embed",
        sourceUtmSource: "reddit",
        sourceUtmMedium: "social",
        sourceUtmCampaign: "r_rpg",
        sourceReferrer: "www.enworld.org",
        sourceLandingPath: "/it/pricing",
      },
    });

    expect(payload.data.attributes).toMatchObject({
      sourceRef: "discord-embed",
      sourceUtmSource: "reddit",
      sourceUtmMedium: "social",
      sourceUtmCampaign: "r_rpg",
      sourceReferrer: "www.enworld.org",
      sourceLandingPath: "/it/pricing",
    });
  });

  it("omits them when source is undefined", () => {
    const payload = new Waitlist().createJsonApi(baseInput);

    for (const key of SOURCE_KEYS) {
      expect(payload.data.attributes).not.toHaveProperty(key);
    }
  });
});

describe("Waitlist.rehydrate()", () => {
  const hydrate = (attributes: Record<string, any>) =>
    new Waitlist().rehydrate({ jsonApi: { type: "waitlists", id: "w-1", attributes }, included: [] });

  it("keeps the questionnaire object the API sends", () => {
    const waitlist = hydrate({ questionnaire: { system: "dnd2024", headache: "Too many plot threads" } });

    expect(waitlist.questionnaire).toEqual({ system: "dnd2024", headache: "Too many plot threads" });
  });

  it("leaves the questionnaire undefined when the API sends none", () => {
    expect(hydrate({ questionnaire: null }).questionnaire).toBeUndefined();
  });
});
