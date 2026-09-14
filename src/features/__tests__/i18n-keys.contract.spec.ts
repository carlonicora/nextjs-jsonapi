import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Every `features/<feature>/i18n-keys.ts` declares the translation keys this
 * package will ask a consuming app to define. Nothing imported those lists, so
 * they were documentation that happened to compile: a component could add a
 * `t("…")` call without touching the contract, and the omission only surfaced
 * in whichever app rendered that branch first. `handbook.notFound` and the six
 * `billing.tokens.*` keys reached several apps that way.
 *
 * These tests read the lists and the sources and compare them, in both
 * directions, so the two cannot drift apart silently again.
 */

const FEATURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = join(FEATURES_DIR, "..");

/**
 * Keys a contract promises that no component in this package reads — the app
 * owns the surface that renders them (administration landing cards, the help
 * landing page, handbook screens an app builds itself). They are legitimate
 * contract entries, so they are listed rather than deleted, but the list is
 * closed: a NEW unread key fails the second test until someone either wires it
 * up, deletes it, or justifies it here.
 */
const DECLARED_FOR_APP_RENDERED_SURFACES = new Set<string>([
  "administration.billing.description",
  "administration.companies.description",
  "administration.group.platform",
  "administration.rbac.description",
  "administration.token_usage.description",
  "administration.users.description",
  "administration.ai_connections.description",
  "handbook.chat.delete_confirm",
  "handbook.chat.rename_placeholder",
  "handbook.contents.title",
  "handbook.notConfigured",
  "handbook.subtitle",
  "help.article.related",
  "help.header.search",
  "help.landing.browseByMode",
  "help.landing.featuredTutorials",
  "help.landing.heading",
  "help.landing.subheading",
  "help.modeIndex.empty",
  "token_usage.series.other",
  "token_usage.timeline.empty",
]);

/** `t("key")`, `t('key')`, `t(`key`)` and their `t.rich(…)` equivalents. */
const STATIC_KEY = /\bt(?:\.rich)?\(\s*(?:"([^"${]+)"|'([^'${]+)'|`([^`${]+)`)/g;
/** ``t(`prefix.${expr}`)`` — only the literal head is knowable. */
const DYNAMIC_PREFIX = /\bt(?:\.rich)?\(\s*`([^`]*?)\$\{/g;

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== "__tests__") sourceFiles(path, found);
    } else if (/\.tsx?$/.test(entry) && !/\.(test|spec)\.tsx?$/.test(entry)) {
      found.push(path);
    }
  }
  return found;
}

/** Where each key is read, so a failure names the file instead of just the key. */
const readKeys = new Map<string, string>();
const dynamicPrefixes = new Set<string>();
for (const file of sourceFiles(SRC_DIR)) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(STATIC_KEY)) {
    const key = (match[1] ?? match[2] ?? match[3])!;
    if (!readKeys.has(key)) readKeys.set(key, relative(SRC_DIR, file));
  }
  for (const match of source.matchAll(DYNAMIC_PREFIX)) {
    if (match[1]) dynamicPrefixes.add(match[1]);
  }
}

const contracts = new Map<string, string[]>();
for (const feature of readdirSync(FEATURES_DIR)) {
  const path = join(FEATURES_DIR, feature, "i18n-keys.ts");
  let source: string;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  contracts.set(
    feature,
    [...source.matchAll(/"([^"]+)"/g)].map((match) => match[1]!),
  );
}

/**
 * Declared keys pooled across features: namespaces are shared (ai-connection
 * reads `administration.*`), so ownership is per namespace, not per directory.
 */
const declared = new Set([...contracts.values()].flat());
const declaredNamespaces = new Set([...declared].map((key) => key.split(".")[0]));

describe("i18n key contracts", () => {
  it("finds a contract to check", () => {
    expect(contracts.size).toBeGreaterThan(0);
    expect(readKeys.size).toBeGreaterThan(0);
  });

  it("declares every key the package reads in a contracted namespace", () => {
    const undeclared = [...readKeys.entries()]
      .filter(([key]) => declaredNamespaces.has(key.split(".")[0]!) && !declared.has(key))
      .map(([key, file]) => `${key} (read in ${file})`)
      .sort();

    expect(undeclared).toEqual([]);
  });

  it.each([...contracts.keys()])("has no unread keys in the %s contract", (feature) => {
    const isRead = (key: string) => readKeys.has(key) || [...dynamicPrefixes].some((prefix) => key.startsWith(prefix));

    const unread = contracts
      .get(feature)!
      .filter((key) => !isRead(key) && !DECLARED_FOR_APP_RENDERED_SURFACES.has(key))
      .sort();

    expect(unread).toEqual([]);
  });
});
