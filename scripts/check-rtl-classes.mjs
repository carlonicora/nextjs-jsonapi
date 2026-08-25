// Lint-time guard: physical directional Tailwind classes / CSS props are
// forbidden in src/ — use logical equivalents, or escape with `rtl-ok`.
import { readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const PATTERNS = [
  /(?<![-\w:[])(?:ml|mr|pl|pr)-(?:\[|\d|auto|px)/g,
  /(?<![-\w:[])-?(?:left|right)-(?:\[|\d|px|full)/g,
  /(?<![-\w])text-(?:left|right)(?![-\w])/g,
  /(?<![-\w])rounded-(?:[lr]|tl|tr|bl|br)(?![a-z])/g,
  /(?<![-\w])border-[lr](?![a-z])/g,
  /(?<![-\w])float-(?:left|right)(?![-\w])/g,
  /(?<![-\w])scroll-(?:ml|mr|pl|pr)-/g,
  /\b(?:marginLeft|marginRight|paddingLeft|paddingRight)\s*[:=]/g,
];

export function findViolations(source, file) {
  if (/__tests__|\.(test|spec)\.[tj]sx?$/.test(file)) return [];
  const out = [];
  const lines = source.split("\n");
  lines.forEach((line, i) => {
    if (line.includes("rtl-ok") || (i > 0 && lines[i - 1].includes("rtl-ok"))) return;
    if (line.includes("data-[side=")) return; // rtl-ok by design (resolved physical side)
    for (const p of PATTERNS) {
      for (const m of line.matchAll(p)) out.push({ file, line: i + 1, match: m[0] });
    }
  });
  return out;
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(name)) yield p;
  }
}

// `process.argv[1]` is not symlink-resolved by node while `import.meta.url` is,
// so compare real paths — otherwise the CLI silently does nothing.
function isDirectInvocation() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectInvocation()) {
  const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "src");
  const all = [];
  for (const f of walk(root)) all.push(...findViolations(readFileSync(f, "utf8"), f));
  if (all.length) {
    for (const v of all) console.error(`${v.file}:${v.line}  ${v.match}`);
    console.error(`\n${all.length} physical directional class(es). Use logical utilities or add an rtl-ok comment.`);
    process.exit(1);
  }
  console.log("check-rtl-classes: clean");
}
