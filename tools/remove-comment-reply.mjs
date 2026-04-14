/**
 * Remove WordPress comment "Reply" blocks from static HTML files.
 *
 * Targets:
 *   <div class="reply"> ... <a class="comment-reply-link" ...>Reply</a> ... </div>
 *
 * Run from repo root:
 *   node tools/remove-comment-reply.mjs
 * Dry-run:
 *   node tools/remove-comment-reply.mjs --dry-run
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

function stripReplyBlocks(html) {
  // Remove the entire reply container (greedy minimal), only if it includes comment-reply-link.
  return html.replace(
    /[\t ]*<div class=["']reply["'][^>]*>[\s\S]*?<a[^>]*class=["']comment-reply-link["'][\s\S]*?<\/div>\s*/gi,
    ""
  );
}

let changed = 0;
let totalRemoved = 0;

for (const file of walkHtml(ROOT)) {
  if (path.relative(ROOT, file).startsWith("tools")) continue;
  const orig = fs.readFileSync(file, "utf8");
  const beforeCount = (orig.match(/class=["']comment-reply-link["']/gi) || [])
    .length;
  if (!beforeCount) continue;
  const next = stripReplyBlocks(orig);
  const afterCount = (next.match(/class=["']comment-reply-link["']/gi) || [])
    .length;
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
    ? `Done dry-run, ${changed} file(s) would change. Reply links removed: ${totalRemoved}.`
    : `Done, ${changed} file(s) updated. Reply links removed: ${totalRemoved}.`
);

