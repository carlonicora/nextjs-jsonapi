// Lint-time guard: every text the library renders has an English and an
// Italian value in messages/, no leaf is dead, and no value names an app.
// Resolver copied from neural-erp's apps/web/scripts/validate-translations.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Patterns to match translation usage
const USE_TRANSLATIONS_PATTERN = /useTranslations\(\s*["']([^"']*)["']\s*\)/g;
const USE_TRANSLATIONS_NO_NS_PATTERN = /useTranslations\(\s*\)/g;
const T_CALL_PATTERN = /\bt\(\s*["']([^"']+)["']/g;
const T_TEMPLATE_CALL_PATTERN = /\bt\(\s*`([^`]+)`/g;
const GET_TRANSLATIONS_PATTERN = /getTranslations\(\s*["']([^"']*)["']\s*\)/g;

// A dotted string literal anywhere in src: a key reached through a constant
// (`labelKey: "entities.companies"`, i18n-keys.ts, OPERATION_LABEL_NAMESPACE).
const LITERAL_PATTERN = /["'`]([a-z0-9_]+(?:\.[a-z0-9_]+)+)["'`]/g;

// Keys the library renders but whose text is the app's by nature (owner
// decision 3: the library holds no information about the application). They
// must NOT be in messages/*.json; every app provides them, with no fallback.
export const APP_PROVIDED_KEYS = [
  /^common\.title$/, // the app's own name
  /^common\.description$/, // the app's own tagline
  /^auth\.login_description$/, // the app's product pitch on the login page
  /^auth\.register_description$/, // the app's product pitch on the register page
  /^features\.assistant\.composer_placeholder$/, // names what the app's assistant knows about
  /^features\.assistant\.starters\./, // example questions about the app's own domain
  /^features\.assistant\.empty_state\.subtitle$/, // says what the app's assistant knows about
  /^auth\.gdpr\.marketing_consent$/, // a consent must name who sends the news: the app
  // The app's own entities (CommonDeleter / RecentPagesNavigator render
  // `entities.${type}` for any module). Only the library's own entities ship.
  /^entities\.(?!(?:assistants|companies|howtos|rbac|roles|users)(?:\.|$))/,
  // Token-usage operation types an app backend defines (operation-label.ts: the
  // app supplies this vocabulary, unknown types render raw). Only the types the
  // backend library emits, plus its customer/platform scopes, ship.
  /^token_usage\.types\.(?!(?:analyser|communitySummariser|counterpartIdentificator|customer|embedding|ethicist|graphCreator|imageAnalysis|imageGeneration|operator|platform|responder|strategy|summariser|textGeneration|transcription)$)/,
];

// Values the app-word rule would flag although the word is the library's own
// meaning, not an app's domain. Each entry carries its reason.
const APP_WORD_EXEMPT_KEYS = new Map([
  ["analytics.admin.dimensions.campaign", "the utm_campaign dimension of web analytics"],
  ["waitlist.admin.source.fields.sourceUtmCampaign", "the utm_campaign tag of a waitlist sign-up source"],
  ["help.modes.how-to", 'Italian "pratiche" = practical (how-to guides), not a case file'],
  ["howto.howToType.how-to", 'Italian "pratica" = practical (how-to guide), not a case file'],
]);

// Template keys whose ids an app backend defines at runtime: there is nothing
// in the library to enumerate, so they are not checked against messages/.
export const DYNAMIC_KEY_ALLOWLIST = [
  // Notification.tsx: notificationType comes from the app's API; each app owns its types.
  "notification.${notification.notificationType}.title",
  // Notification.tsx: the action button of an app-defined notification type.
  "notification.${notification.notificationType}.buttons.action",
];

// No value may name an app or use an app's domain word (owner decision 3).
const APP_WORDS = [
  /wyrdli/i,
  /phlow/i,
  /adhstudy/i,
  /neural[- ]erp/i,
  /a360ai/i,
  /avvocato360/i,
  /360studioai/i,
  /only35/i,
  /dreamer/i,
  /\bcampaigns?\b/i,
  /\bcampagn[ae]\b/i,
  /\bscenes?\b/i,
  /\bscen[ae]\b/i,
  /\bnpcs?\b/i,
  /\bpratich?[ae]\b/i,
  /\bstorytellers?\b/i,
  /\bnarrator[ei]\b/i,
  /\bemployees?\b/i,
  /\bdipendent[ei]\b/i,
];

const isAppProvided = (key) => APP_PROVIDED_KEYS.some((p) => p.test(key));

/**
 * Recursively get all keys from a nested object
 */
function getAllKeys(obj, prefix = "") {
  const keys = new Set();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nestedKeys = getAllKeys(value, fullKey);
      nestedKeys.forEach((k) => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  }

  return keys;
}

export function leafKeys(tree, prefix = "") {
  return getAllKeys(tree, prefix);
}

/**
 * Escape a string for literal use inside a RegExp
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Turn a template-literal key (`a.${x}.label`) into a RegExp matching full leaf keys.
 * Returns null when the template cannot be parsed reliably (nested template literals).
 */
export function dynamicKeyToRegExp(template) {
  const parts = [];
  let index = 0;
  while (index < template.length) {
    const start = template.indexOf("${", index);
    if (start === -1) {
      parts.push(escapeRegExp(template.slice(index)));
      break;
    }
    parts.push(escapeRegExp(template.slice(index, start)));
    let depth = 1;
    let cursor = start + 2;
    while (cursor < template.length && depth > 0) {
      if (template[cursor] === "{") depth++;
      else if (template[cursor] === "}") depth--;
      cursor++;
    }
    if (depth !== 0) return null;
    parts.push("[^.]+");
    index = cursor;
  }
  return new RegExp(`^${parts.join("")}$`);
}

/**
 * Extract translation keys from a single file
 */
function extractKeysFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const usages = [];

  // Find all useTranslations calls with namespaces in this file
  const namespaces = [];

  // Match useTranslations("namespace")
  let match;
  const contentForNamespace = content;

  // Reset regex
  USE_TRANSLATIONS_PATTERN.lastIndex = 0;
  while ((match = USE_TRANSLATIONS_PATTERN.exec(contentForNamespace)) !== null) {
    const lineNumber = content.substring(0, match.index).split("\n").length;
    namespaces.push({ namespace: match[1], line: lineNumber });
  }

  // Match useTranslations() without namespace
  USE_TRANSLATIONS_NO_NS_PATTERN.lastIndex = 0;
  while ((match = USE_TRANSLATIONS_NO_NS_PATTERN.exec(contentForNamespace)) !== null) {
    const lineNumber = content.substring(0, match.index).split("\n").length;
    namespaces.push({ namespace: "", line: lineNumber });
  }

  // Match getTranslations("namespace") for server components
  GET_TRANSLATIONS_PATTERN.lastIndex = 0;
  while ((match = GET_TRANSLATIONS_PATTERN.exec(contentForNamespace)) !== null) {
    const lineNumber = content.substring(0, match.index).split("\n").length;
    namespaces.push({ namespace: match[1], line: lineNumber });
  }

  // If no useTranslations found but t() is used, assume no namespace
  if (namespaces.length === 0) {
    namespaces.push({ namespace: "", line: 0 });
  }

  const activeNamespaceAt = (lineNumber) => {
    let activeNamespace = "";
    for (const ns of namespaces) {
      if (ns.line <= lineNumber) {
        activeNamespace = ns.namespace;
      }
    }
    return activeNamespace;
  };

  const addUsage = (key, index, dynamic) => {
    const lineNumber = content.substring(0, index).split("\n").length;
    const activeNamespace = activeNamespaceAt(lineNumber);
    usages.push({
      key: activeNamespace ? `${activeNamespace}.${key}` : key,
      file: filePath,
      line: lineNumber,
      dynamic,
    });
  };

  // Find all t("key") / t('key') calls
  T_CALL_PATTERN.lastIndex = 0;
  while ((match = T_CALL_PATTERN.exec(content)) !== null) {
    // Plain-quoted strings cannot interpolate; a "{" means this is not a key
    if (match[1].includes("{")) continue;
    addUsage(match[1], match.index, false);
  }

  // Find all t(`key`) and t(`prefix.${expr}.suffix`) calls
  T_TEMPLATE_CALL_PATTERN.lastIndex = 0;
  while ((match = T_TEMPLATE_CALL_PATTERN.exec(content)) !== null) {
    const key = match[1];
    const dynamic = key.includes("${");
    if (!dynamic && key.includes("{")) continue;
    // A key that is nothing but an interpolation carries no static information
    if (dynamic && /^\$\{[^]*\}$/.test(key) && dynamicKeyToRegExp(key)?.source === "^[^.]+$") continue;
    addUsage(key, match.index, dynamic);
  }

  return usages;
}

/**
 * Recursively find all TypeScript/JavaScript files
 */
function findSourceFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "coverage" ||
        entry.name === "__tests__" ||
        entry.name === "tests"
      ) {
        continue;
      }
      findSourceFiles(fullPath, files);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx") &&
      !entry.name.endsWith(".spec.ts") &&
      !entry.name.endsWith(".spec.tsx") &&
      !entry.name.endsWith(".d.ts")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

export function collectUsages(sourceRoot) {
  return findSourceFiles(sourceRoot).flatMap((file) => extractKeysFromFile(file));
}

/**
 * Dotted literals in one file's source. Comment lines (`//`, `/*`, ` *`) are
 * skipped: prose there quotes config paths and keys that are not usages.
 */
export function literalsIn(content) {
  const literals = new Set();
  for (const line of content.split("\n")) {
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
    for (const m of line.matchAll(LITERAL_PATTERN)) literals.add(m[1]);
  }
  return literals;
}

export function collectLiterals(sourceRoot) {
  const literals = new Set();
  for (const file of findSourceFiles(sourceRoot)) {
    for (const literal of literalsIn(fs.readFileSync(file, "utf-8"))) literals.add(literal);
  }
  return literals;
}

function valueAt(tree, key) {
  let node = tree;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = node[part];
  }
  return node;
}

function dottedPrefixes(key) {
  const parts = key.split(".");
  return parts.map((_, i) => parts.slice(0, i + 1).join("."));
}

export function validate({ en, it, usages, literals }) {
  const findings = [];
  const enKeys = leafKeys(en);
  const itKeys = leafKeys(it);
  const where = (u) => `${u.file}:${u.line}`;

  const patterns = [];
  for (const usage of usages) {
    if (isAppProvided(usage.key)) continue;
    if (!usage.dynamic) {
      if (!enKeys.has(usage.key)) findings.push({ rule: "missing", key: usage.key, detail: where(usage) });
      continue;
    }
    if (DYNAMIC_KEY_ALLOWLIST.includes(usage.key)) continue;
    const pattern = dynamicKeyToRegExp(usage.key);
    if (!pattern) continue;
    patterns.push(pattern);
    if (![...enKeys].some((k) => pattern.test(k))) {
      findings.push({ rule: "dynamic-unmatched", key: usage.key, detail: where(usage) });
    }
  }

  // A dotted string literal anchored in a library namespace (its first segment is
  // a top-level key of en.json) is a key the code reaches without t(): the
  // i18n-keys.ts contracts, labelKey props, OPERATION_LABEL_NAMESPACE. It must
  // resolve to a leaf or to a prefix of leaves, or the app renders the key path.
  const namespaces = new Set(Object.keys(en));
  for (const literal of literals) {
    if (!namespaces.has(literal.split(".")[0])) continue;
    if (isAppProvided(literal) || isAppProvided(`${literal}.`)) continue;
    const resolves = enKeys.has(literal) || [...enKeys].some((k) => k.startsWith(`${literal}.`));
    if (!resolves) findings.push({ rule: "missing", key: literal, detail: "string literal anchored in a library namespace resolves to no text" });
  }

  for (const key of enKeys) {
    if (!itKeys.has(key)) findings.push({ rule: "parity", key, detail: "in en.json, not in it.json" });
  }
  for (const key of itKeys) {
    if (!enKeys.has(key)) findings.push({ rule: "parity", key, detail: "in it.json, not in en.json" });
  }

  const staticKeys = new Set(usages.filter((u) => !u.dynamic).map((u) => u.key));
  for (const key of enKeys) {
    if (isAppProvided(key)) {
      findings.push({ rule: "app-word", key, detail: "app-provided key must not ship in the library" });
      continue;
    }
    const used =
      staticKeys.has(key) || patterns.some((p) => p.test(key)) || dottedPrefixes(key).some((p) => literals.has(p));
    if (!used) findings.push({ rule: "unused", key, detail: "no t() call or literal reaches it" });
  }

  for (const [locale, tree, keys] of [
    ["en", en, enKeys],
    ["it", it, itKeys],
  ]) {
    for (const key of keys) {
      if (APP_WORD_EXEMPT_KEYS.has(key)) continue;
      const value = valueAt(tree, key);
      const word = APP_WORDS.find((w) => typeof value === "string" && w.test(value));
      if (word) findings.push({ rule: "app-word", key, detail: `${locale}: "${value}" matches ${word}` });
    }
  }

  for (const key of enKeys) {
    if (!itKeys.has(key)) continue;
    const value = valueAt(en, key);
    if (value === valueAt(it, key)) findings.push({ rule: "identical", key, detail: JSON.stringify(value) });
  }

  return findings;
}

// `process.argv[1]` is not symlink-resolved by node while `import.meta.url` is,
// so compare real paths — otherwise the CLI silently does nothing.
function isDirectInvocation() {
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectInvocation()) {
  const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
  const src = path.join(root, "src");
  const read = (name) => JSON.parse(fs.readFileSync(path.join(root, "messages", name), "utf-8"));
  const en = read("en.json");
  const findings = validate({ en, it: read("it.json"), usages: collectUsages(src), literals: collectLiterals(src) });

  const byRule = new Map();
  for (const f of findings) byRule.set(f.rule, [...(byRule.get(f.rule) ?? []), f]);

  const identical = byRule.get("identical") ?? [];
  if (identical.length) {
    console.log(`identical en/it values (report only, ${identical.length}):`);
    for (const f of identical) console.log(`  ${f.key}  ${f.detail}`);
    console.log("");
  }

  let failures = 0;
  for (const [rule, list] of byRule) {
    if (rule === "identical") continue;
    failures += list.length;
    console.error(`${rule} (${list.length}):`);
    for (const f of list) console.error(`  ${f.key}  ${f.detail}`);
    console.error("");
  }
  if (failures) {
    console.error(`validate-messages: ${failures} problem(s)`);
    process.exit(1);
  }
  console.log(`validate-messages: clean (${leafKeys(en).size} keys)`);
}
