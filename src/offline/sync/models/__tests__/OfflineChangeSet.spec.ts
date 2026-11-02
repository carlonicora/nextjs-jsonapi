import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../permissions/types";
import { OfflineChangeSet } from "../OfflineChangeSet";
import { offlineModules } from "../offline.modules";

const moduleFactory: ModuleFactory = (params) =>
  ({ pageUrl: params.pageUrl, name: params.name, model: params.model }) as ModuleWithPermissions;

const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  for (const [key, module] of Object.entries(offlineModules(moduleFactory))) registerIfAbsent(key, module);
});

describe("OfflineChangeSet", () => {
  it("createJsonApi emits type offline-change-sets, the id and attributes.changes", () => {
    const changes = [
      { seq: 1, method: "POST" as const, path: "npcs", body: { data: { type: "npcs", id: "n1" } } },
      { seq: 2, method: "DELETE" as const, path: "npcs/n2", recordType: "npcs", recordId: "n2", base: { id: "n2" } },
    ];
    const doc = new OfflineChangeSet().createJsonApi({ id: "pkg-1", changes });
    expect(doc.data.type).toBe("offline-change-sets");
    expect(doc.data.id).toBe("pkg-1");
    expect(doc.data.attributes.changes).toEqual(changes);
  });

  it("rehydrate reads results", () => {
    const results = [
      { seq: 1, status: "applied" },
      { seq: 2, status: "conflict", conflict: "fields", conflictFields: ["name"] },
    ];
    const set = new OfflineChangeSet().rehydrate({
      jsonApi: { type: "offline-change-sets", id: "pkg-1", attributes: { results } },
      included: [],
    } as any);
    expect(set.id).toBe("pkg-1");
    expect(set.results).toEqual(results);
  });
});
