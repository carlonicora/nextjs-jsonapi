import { describe, expect, it } from "vitest";
import { mergeMessages, type MessageTree } from "../mergeMessages";

describe("mergeMessages", () => {
  const base: MessageTree = { auth: { buttons: { login: "Log in", register: "Register" } }, onlyBase: { x: "b" } };
  const override: MessageTree = { auth: { buttons: { login: "Sign in" }, extra: "e" }, onlyOverride: { y: "o" } };

  it("override leaf wins, base-only and override-only paths survive", () => {
    const merged = mergeMessages(base, override);
    expect(merged).toEqual({
      auth: { buttons: { login: "Sign in", register: "Register" }, extra: "e" },
      onlyBase: { x: "b" },
      onlyOverride: { y: "o" },
    });
  });
  it("merges three levels deep", () => {
    expect(mergeMessages({ a: { b: { c: "1", d: "2" } } }, { a: { b: { c: "9" } } })).toEqual({
      a: { b: { c: "9", d: "2" } },
    });
  });
  it("replaces when one side is a string and the other a tree", () => {
    expect(mergeMessages({ a: "s" }, { a: { b: "t" } })).toEqual({ a: { b: "t" } });
    expect(mergeMessages({ a: { b: "t" } }, { a: "s" })).toEqual({ a: "s" });
  });
  it("replaces arrays, never merges them, and copies them", () => {
    const b: MessageTree = { title: { options: ["Mr", "Mrs", "Dr"] }, keep: ["a"] };
    const o: MessageTree = { title: { options: ["Sig.", "Sig.ra"] } };
    const merged = mergeMessages(b, o);
    expect(merged).toEqual({ title: { options: ["Sig.", "Sig.ra"] }, keep: ["a"] });
    expect((merged.title as MessageTree).options).not.toBe((o.title as MessageTree).options);
    expect(merged.keep).not.toBe(b.keep);
    expect(mergeMessages({ a: ["x"] }, { a: { b: "t" } })).toEqual({ a: { b: "t" } });
    expect(mergeMessages({ a: { b: "t" } }, { a: ["x"] })).toEqual({ a: ["x"] });
  });
  it("inputs untouched, result is a new object", () => {
    const b = { a: { x: "1" } };
    const o = { a: { y: "2" } };
    const merged = mergeMessages(b, o);
    expect(b).toEqual({ a: { x: "1" } });
    expect(o).toEqual({ a: { y: "2" } });
    expect(merged).not.toBe(b);
    expect(merged.a).not.toBe(b.a);
  });
  it("empty override returns a deep copy of the base", () => {
    const merged = mergeMessages(base, {});
    expect(merged).toEqual(base);
    expect(merged).not.toBe(base);
  });
});
