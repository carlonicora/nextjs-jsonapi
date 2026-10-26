import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { AccountDeletion } from "../account-deletion";

// createJsonApi() resolves Modules.AccountDeletion through the real ModuleRegistry,
// which is shared across test files in a worker: register only when absent.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("AccountDeletion", { name: "account-deletions", model: AccountDeletion } as any);
});

const USER_ID = "11111111-1111-4111-8111-111111111111";
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("AccountDeletion", () => {
  describe("rehydrate", () => {
    it("parses scheduledAt and requestedAt into Date", () => {
      const model = new AccountDeletion().rehydrate({
        jsonApi: {
          type: "account-deletions",
          id: USER_ID,
          attributes: {
            requestedAt: "2026-10-25T10:00:00.000Z",
            scheduledAt: "2026-11-01T10:00:00.000Z",
            hasDeliverableEmail: true,
            hasActiveSubscription: true,
            deletesCompany: true,
            ownedCount: 3,
            otherTables: ["The Long Road"],
          },
        },
        included: [],
      } as any);

      expect(model.requestedAt).toBeInstanceOf(Date);
      expect(model.requestedAt?.toISOString()).toBe("2026-10-25T10:00:00.000Z");
      expect(model.scheduledAt).toBeInstanceOf(Date);
      expect(model.scheduledAt?.toISOString()).toBe("2026-11-01T10:00:00.000Z");
      expect(model.hasDeliverableEmail).toBe(true);
      expect(model.hasActiveSubscription).toBe(true);
      expect(model.deletesCompany).toBe(true);
      expect(model.ownedCount).toBe(3);
      expect(model.otherTables).toEqual(["The Long Road"]);
    });

    it("leaves both dates undefined and defaults the rest when nothing is pending", () => {
      const model = new AccountDeletion().rehydrate({
        jsonApi: { type: "account-deletions", id: USER_ID, attributes: {} },
        included: [],
      } as any);

      expect(model.requestedAt).toBeUndefined();
      expect(model.scheduledAt).toBeUndefined();
      expect(model.hasDeliverableEmail).toBe(false);
      expect(model.hasActiveSubscription).toBe(false);
      expect(model.deletesCompany).toBe(false);
      expect(model.ownedCount).toBe(0);
      expect(model.otherTables).toEqual([]);
    });
  });

  describe("createJsonApi", () => {
    it("type account-deletions, id, attributes.confirmation", () => {
      const payload = new AccountDeletion().createJsonApi({ id: USER_ID, confirmation: "gm@example.com" });

      expect(payload.data.type).toBe("account-deletions");
      expect(payload.data.id).toBe(USER_ID);
      expect(payload.data.attributes).toEqual({ confirmation: "gm@example.com" });
    });
  });

  describe("createKeepJsonApi", () => {
    it("type account-deletions, a v4 id, attributes.token", () => {
      const payload = new AccountDeletion().createKeepJsonApi({ token: "raw-token" });

      expect(payload.data.type).toBe("account-deletions");
      expect(payload.data.id).toMatch(UUID_V4);
      expect(payload.data.attributes).toEqual({ token: "raw-token" });
    });
  });
});
