import { describe, expect, it } from "vitest";
import { matchRoute } from "../router";
import type { OfflineRoute } from "../types";
import { patternToString } from "../types";

const Npcs = { name: "npcs", model: class {} };
const Roots = { name: "roots", model: class {} };
const answer = (label: string) => async () => ({ status: 200, body: { label } });

describe("matchRoute", () => {
  it("custom routes win over generic ones", async () => {
    const custom: OfflineRoute = {
      method: "GET",
      pattern: [Roots, ":id", "scenes", "playing"],
      answer: answer("custom"),
      queue: false,
    };
    const generic: OfflineRoute = {
      method: "GET",
      pattern: [":parentType", ":parentId", "scenes", ":x"],
      answer: answer("generic"),
      queue: false,
    };

    const match = matchRoute([custom, generic], "GET", "roots/C/scenes/playing");

    expect(match?.route).toBe(custom);
  });

  it("a Module segment matches its endpoint", () => {
    const route: OfflineRoute = { method: "GET", pattern: [Npcs, ":id"], answer: answer("one"), queue: false };

    expect(matchRoute([route], "GET", "npcs/n1")?.params).toEqual({ id: "n1" });
    expect(matchRoute([route], "GET", "factions/n1")).toBeNull();
    expect(patternToString([Roots, ":id", Npcs])).toBe("roots/:id/npcs");
  });

  it(":id captures one segment", () => {
    const route: OfflineRoute = { method: "GET", pattern: [Npcs, ":id"], answer: answer("one"), queue: false };

    expect(matchRoute([route], "GET", "npcs/n1/factions")).toBeNull();
    expect(matchRoute([route], "GET", "npcs")).toBeNull();
    expect(matchRoute([route], "PATCH", "npcs/n1")).toBeNull();
  });

  it("the query string is ignored for matching", () => {
    const route: OfflineRoute = {
      method: "GET",
      pattern: [Roots, ":id", Npcs],
      answer: answer("list"),
      queue: false,
    };

    expect(matchRoute([route], "GET", "roots/C/npcs?fetchAll=true&page[size]=5")?.params).toEqual({ id: "C" });
  });
});
