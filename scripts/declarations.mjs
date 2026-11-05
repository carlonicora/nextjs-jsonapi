// Type declarations, shared by the release build (scripts/build-types.mjs) and the
// dev watcher (scripts/dev-watch.mjs).
//
// tsc emits one .d.ts per source file into dist/, next to the JavaScript tsup
// builds. This replaced tsup's bundled `dts` pass, which needed an 8 GB heap
// (and still ran out) where tsc needs about 1 GB.
//
// tsc keeps the `@/…` path aliases verbatim in the emitted declarations, and the
// consuming app cannot resolve them (its own `@/` points at its own src), so after
// every tsc pass the aliases are rewritten to relative paths.
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
export const bin = (name) => path.join(root, "node_modules", ".bin", name);

// Mirrors tsconfig.json `paths`, most specific first.
const ALIASES = [
  ["@/components/ui/", "shadcnui/ui/"],
  ["@/lib/", "lib/"],
  ["@/hooks/", "hooks/"],
  ["@/", ""],
];

function resolveAlias(file, specifier) {
  for (const [prefix, target] of ALIASES) {
    if (!specifier.startsWith(prefix)) continue;
    const absolute = path.join(dist, target + specifier.slice(prefix.length));
    let relative = path.relative(path.dirname(file), absolute).split(path.sep).join("/");
    if (!relative.startsWith(".")) relative = `./${relative}`;
    return relative;
  }
  return specifier;
}

const seen = new Map();

async function walk(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

export async function rewriteAliases() {
  const files = await walk(dist, []);
  let rewritten = 0;
  for (const file of files) {
    const { mtimeMs } = await stat(file);
    if (seen.get(file) === mtimeMs) continue;
    const source = await readFile(file, "utf8");
    const next = source.replace(/(["'])(@\/[^"']+)\1/g, (_, quote, spec) => `${quote}${resolveAlias(file, spec)}${quote}`);
    if (next !== source) {
      await writeFile(file, next);
      rewritten++;
    }
    seen.set(file, (await stat(file)).mtimeMs);
  }
  return rewritten;
}

// tsc reads its own config, which extends the package's and always leaves the
// tests out: some packages' tsconfig.json still includes them, so tsc would
// report test-only type errors and emit declarations for them.
export async function writeDeclarationsTsconfig() {
  const file = path.join(root, "node_modules", ".cache", "declarations", "tsconfig.json");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(
    file,
    JSON.stringify(
      {
        extends: "../../../tsconfig.json",
        include: ["../../../src/**/*.ts", "../../../src/**/*.tsx"],
        exclude: [
          "../../../src/**/*.spec.ts",
          "../../../src/**/*.spec.tsx",
          "../../../src/**/*.test.ts",
          "../../../src/**/*.test.tsx",
          "../../../src/**/__tests__/**/*",
        ],
      },
      null,
      2,
    ),
  );
  return file;
}
