import { describe, expect, it } from "vitest";
import { leafKeys, validate, APP_PROVIDED_KEYS, literalsIn } from "./validate-messages.mjs";

const en = { auth: { buttons: { login: "Log in" } }, oauth: { ui: { scopes: { read: { name: "Read" } } } }, dead: { key: "x" } };
const itTree = { auth: { buttons: { login: "Accedi" } }, oauth: { ui: { scopes: { read: { name: "Lettura" } } } }, dead: { key: "x" } };
const usage = (key: string, dynamic = false) => ({ key, file: "f.tsx", line: 1, dynamic });

describe("validate-messages", () => {
  it("leafKeys flattens nested paths", () => {
    expect([...leafKeys(en)].sort()).toEqual(["auth.buttons.login", "dead.key", "oauth.ui.scopes.read.name"]);
  });
  it("reports a static key with no text", () => {
    const f = validate({ en, it: itTree, usages: [usage("auth.buttons.register")], literals: new Set() });
    expect(f).toContainEqual(expect.objectContaining({ rule: "missing", key: "auth.buttons.register" }));
  });
  it("matches a dynamic key by pattern and reports one that matches nothing", () => {
    const ok = validate({ en, it: itTree, usages: [usage("oauth.ui.scopes.${id}.name", true)], literals: new Set(["dead.key"]) });
    expect(ok.filter((x) => x.rule === "dynamic-unmatched")).toHaveLength(0);
    const bad = validate({ en, it: itTree, usages: [usage("oauth.ui.scopes.${id}.label", true)], literals: new Set(["dead.key"]) });
    expect(bad).toContainEqual(expect.objectContaining({ rule: "dynamic-unmatched" }));
  });
  it("reports en/it parity both ways", () => {
    const f = validate({ en, it: { auth: { buttons: { login: "Accedi", extra: "x" } } }, usages: [], literals: new Set() });
    expect(f.filter((x) => x.rule === "parity").map((x) => x.key).sort()).toEqual(["auth.buttons.extra", "dead.key", "oauth.ui.scopes.read.name"]);
  });
  it("counts a leaf as used through t(), a literal, or a dotted prefix literal; otherwise unused", () => {
    const f = validate({ en, it: itTree, usages: [usage("auth.buttons.login")], literals: new Set(["oauth.ui.scopes"]) });
    expect(f.filter((x) => x.rule === "unused").map((x) => x.key)).toEqual(["dead.key"]);
  });
  it("requires a namespace-anchored literal to resolve; ignores literals outside the namespaces", () => {
    const f = validate({
      en,
      it: itTree,
      usages: [usage("auth.buttons.login"), usage("dead.key"), usage("oauth.ui.scopes.read.name")],
      literals: new Set(["auth.buttons.register", "auth.buttons", "next.config", "common.title"]),
    });
    expect(f.filter((x) => x.rule === "missing").map((x) => x.key)).toEqual(["auth.buttons.register"]);
  });
  it("collects dotted literals from code lines only, never from comment lines", () => {
    const src = `// a consumer with no \`handbook.path\`\n/* "x.y.z" */\n * "p.q"\nconst k = "billing.admin.title"; t(\`a.b\`);\n`;
    expect([...literalsIn(src)].sort()).toEqual(["a.b", "billing.admin.title"]);
  });
  it("fails on an app name in any value, case-insensitive", () => {
    const f = validate({ en: { a: "Welcome to Wyrdli" }, it: { a: "Benvenuto in wyrdli" }, usages: [usage("a")], literals: new Set() });
    expect(f.filter((x) => x.rule === "app-word")).toHaveLength(2);
  });
  it("exempts app-provided keys from missing and parity, and never lists them as unused", () => {
    expect(APP_PROVIDED_KEYS.some((p) => p.test("common.title"))).toBe(true);
    const f = validate({ en, it: itTree, usages: [usage("common.title")], literals: new Set() });
    expect(f.filter((x) => x.key === "common.title")).toHaveLength(0);
  });
  it("reports an identical en/it value without failing", () => {
    const f = validate({ en, it: itTree, usages: [usage("auth.buttons.login"), usage("dead.key"), usage("oauth.ui.scopes.read.name")], literals: new Set() });
    expect(f).toContainEqual(expect.objectContaining({ rule: "identical", key: "dead.key" }));
  });
});
