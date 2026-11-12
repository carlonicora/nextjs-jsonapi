import { describe, expect, it } from "vitest";
import { nextSortValue, sortFieldsOf, sortStateFor } from "../sorting";

describe("nextSortValue", () => {
  it("starts ascending when the column is not sorted", () => {
    expect(nextSortValue(undefined, ["name"])).toBe("name");
  });

  it("goes from ascending to descending", () => {
    expect(nextSortValue("name", ["name"])).toBe("-name");
  });

  it("clears the sort after descending", () => {
    expect(nextSortValue("-name", ["name"])).toBeNull();
  });

  it("starts ascending when another column holds the sort", () => {
    expect(nextSortValue("-createdAt", ["name"])).toBe("name");
  });

  it("writes every field of a composite column", () => {
    expect(nextSortValue(undefined, ["lastName", "firstName"])).toBe("lastName,firstName");
    expect(nextSortValue("lastName,firstName", ["lastName", "firstName"])).toBe("-lastName,-firstName");
    expect(nextSortValue("-lastName,-firstName", ["lastName", "firstName"])).toBeNull();
  });
});

describe("sortFieldsOf", () => {
  it("uses meta.sortFields when the column declares them", () => {
    expect(sortFieldsOf({ id: "name", columnDef: { meta: { sortFields: ["lastName", "firstName"] } } })).toEqual([
      "lastName",
      "firstName",
    ]);
  });

  it("falls back to the column id", () => {
    expect(sortFieldsOf({ id: "name", columnDef: { meta: { className: "w-10" } } })).toEqual(["name"]);
    expect(sortFieldsOf({ id: "name", columnDef: {} })).toEqual(["name"]);
  });

  it("returns no field for a column without id or sortFields", () => {
    expect(sortFieldsOf({ columnDef: {} })).toEqual([]);
  });
});

describe("sortStateFor", () => {
  it("reads a descending composite sort", () => {
    expect(sortStateFor("-lastName,-firstName", ["lastName", "firstName"])).toBe("desc");
  });

  it("reads an ascending sort", () => {
    expect(sortStateFor("name", ["name"])).toBe("asc");
  });

  it("returns undefined when the sort belongs to another column or is absent", () => {
    expect(sortStateFor("-createdAt", ["name"])).toBeUndefined();
    expect(sortStateFor(undefined, ["name"])).toBeUndefined();
    expect(sortStateFor("lastName", ["lastName", "firstName"])).toBeUndefined();
    expect(sortStateFor("name", [])).toBeUndefined();
  });
});
