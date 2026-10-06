#!/usr/bin/env node
// Dev watcher: code and types are rebuilt by two separate, light processes.
//
// `tsup --watch` with `dts` regenerates the BUNDLED declarations for every entry
// on each save, which peaks near 7 GB and, on a machine already short of memory,
// crashes the watcher (fsevents napi assertion) and takes the whole dev run down.
// In dev we therefore run:
//   1. tsup --watch with TSUP_NO_DTS=1 — JavaScript only, exactly as before;
//   2. tsc --watch --emitDeclarationOnly — one .d.ts per source file, incremental.
// tsc keeps the `@/…` path aliases verbatim in the emitted declarations, and the
// consuming app cannot resolve them (its own `@/` points at its own src), so after
// every tsc pass the aliases are rewritten to relative paths.
//
// The release build (`pnpm build`) is untouched: it still emits bundled types.
import { spawn } from "node:child_process";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const bin = (name) => path.join(root, "node_modules", ".bin", name);

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

async function rewriteAliases() {
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
  if (rewritten > 0) console.log(`[dev-types] rewrote path aliases in ${rewritten} declaration file(s)`);
}

const children = [];

function run(command, args, env, onLine) {
  const child = spawn(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  const forward = (stream, target) => {
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        target.write(`${line}\n`);
        onLine?.(line);
      }
    });
  };
  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`[dev-watch] ${path.basename(command)} exited (${signal ?? code}); stopping`);
    shutdown(code ?? 1);
  });
  return child;
}

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) if (child.exitCode === null) child.kill("SIGTERM");
  process.exit(code);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

let rewriting = Promise.resolve();
run(bin("tsup"), ["--watch"], { TSUP_NO_DTS: "1" });
run(
  bin("tsc"),
  ["-p", "tsconfig.json", "--watch", "--emitDeclarationOnly", "--preserveWatchOutput"],
  {},
  (line) => {
    if (line.includes("Watching for file changes")) {
      rewriting = rewriting.then(rewriteAliases).catch((error) => console.error("[dev-types]", error));
    }
  },
);
