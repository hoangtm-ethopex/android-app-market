/**
 * Remove WordPress "Post navigation" blocks from static HTML files.
 *
 * Targets:
 *   <nav id="nav-below"> ... </nav>
 * Optionally followed by: <!-- #nav-below -->
 *
 * Run from repo root:
 *   node tools/remove-nav-below.mjs
 * Dry-run:
 *   node tools/remove-nav-below.mjs --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const dry = process.argv.includes("--dry-run");

function* walkHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkHtml(full);
    else if (e.isFile() && e.name.endsWith(".html")) yield full;
  }
}

function stripNavBelow(html) {
  return html.replace(
    /[\t ]*<nav[^>]*\bid=["']nav-below["'][^>]*>[\s\S]*?<\/nav>\s*(?:<!--\s*#nav-below\s*-->\s*)?/gi,
    ""
  );
}

let changed = 0;
let totalRemoved = 0;

for (const file of walkHtml(ROOT)) {
  if (path.relative(ROOT, file).startsWith("tools")) continue;
  const orig = fs.readFileSync(file, "utf8");
  const beforeCount = (orig.match(/\bid=["']nav-below["']/gi) || []).length;
  if (!beforeCount) continue;
  const next = stripNavBelow(orig);
  const afterCount = (next.match(/\bid=["']nav-below["']/gi) || []).length;
  const removed = beforeCount - afterCount;
  if (removed > 0) {
    changed++;
    totalRemoved += removed;
    if (!dry) fs.writeFileSync(file, next, "utf8");
    console.log(dry ? "[dry] would update:" : "updated:", path.relative(ROOT, file));
  }
}

console.log(
  dry
    ? `Done dry-run, ${changed} file(s) would change. nav-below removed: ${totalRemoved}.`
    : `Done, ${changed} file(s) updated. nav-below removed: ${totalRemoved}.`
);

