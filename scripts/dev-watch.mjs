#!/usr/bin/env node
// Dev watcher: code and types are rebuilt by two separate, light processes:
//   1. tsup --watch — JavaScript only;
//   2. tsc --watch --emitDeclarationOnly — one .d.ts per source file, incremental,
//      followed after every pass by the `@/…` alias rewrite (scripts/declarations.mjs).
// The release build emits the same declarations once (scripts/build-types.mjs).
import { spawn } from "node:child_process";
import path from "node:path";
import { bin, rewriteAliases, root, writeDeclarationsTsconfig } from "./declarations.mjs";

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

const tsconfig = await writeDeclarationsTsconfig();

let rewriting = Promise.resolve();
run(bin("tsup"), ["--watch"]);
run(
  bin("tsc"),
  ["-p", tsconfig, "--watch", "--emitDeclarationOnly", "--preserveWatchOutput"],
  {},
  (line) => {
    if (line.includes("Watching for file changes")) {
      rewriting = rewriting
        .then(rewriteAliases)
        .then((rewritten) => {
          if (rewritten > 0) console.log(`[dev-types] rewrote path aliases in ${rewritten} declaration file(s)`);
        })
        .catch((error) => console.error("[dev-types]", error));
    }
  },
);
