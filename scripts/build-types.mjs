#!/usr/bin/env node
// Release build's type declarations: one tsc pass, then the `@/…` alias rewrite.
// See scripts/declarations.mjs.
import { spawnSync } from "node:child_process";
import { bin, rewriteAliases, root, writeDeclarationsTsconfig } from "./declarations.mjs";

const tsconfig = await writeDeclarationsTsconfig();
const result = spawnSync(bin("tsc"), ["-p", tsconfig, "--emitDeclarationOnly"], { cwd: root, stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);

const rewritten = await rewriteAliases();
console.log(`[build-types] declarations emitted; rewrote path aliases in ${rewritten} file(s)`);
