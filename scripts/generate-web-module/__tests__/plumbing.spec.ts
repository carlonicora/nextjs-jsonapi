import { describe, it, expect } from "vitest";
import { makeFrontendData, makeRelationship } from "./fixtures";
import { resolveRelationshipKey } from "../transformers/relationship-key";

describe("frontend plumbing", () => {
  it("defaults displayProp to name", () => {
    const d = makeFrontendData();
    expect(d.displayProp).toBe("name");
  });

  it("resolves wire key from explicit dtoKey verbatim", () => {
    expect(resolveRelationshipKey(makeRelationship({ dtoKey: "estimateitems" }))).toBe("estimateitems");
  });

  it("derives wire key identically to the backend when dtoKey absent", () => {
    expect(resolveRelationshipKey(makeRelationship({ name: "Account", single: true }))).toBe("account");
    expect(resolveRelationshipKey(makeRelationship({ name: "Person", single: false }))).toBe("persons");
    expect(resolveRelationshipKey(makeRelationship({ alias: "EstimateItem", single: false }))).toBe("estimate-items");
  });
});
