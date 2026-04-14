/**
 * Thêm 2 link Privacy + About vào menu trong <nav id="access"> cho toàn bộ site.
 * Chạy từ thư mục gốc CrawlArc:
 *   node tools/add-privacy-about-menu.mjs
 * Dry-run:
 *   node tools/add-privacy-about-menu.mjs --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function* walkHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkHtml(full);
    else if (e.isFile() && e.name.endsWith(".html")) yield full;
  }
}

const PRIV_HREF_RE = /href=["']\/privacy-policy\.html["']/i;
const ABOUT_HREF_RE = /href=["']\/about\.html["']/i;
const CONTACT_HREF_RE = /href=["']\/contact\.html["']/i;

function findMatchingUl(html, ulOpenIdx) {
  // Walk tags from ulOpenIdx, track nested <ul> ... </ul>.
  const len = html.length;
  let i = ulOpenIdx;
  // Find end of opening tag
  const openEnd = html.indexOf(">", i);
  if (openEnd === -1) return null;
  i = openEnd + 1;
  let depth = 1;
  while (i < len) {
    const nextOpen = html.indexOf("<ul", i);
    const nextClose = html.indexOf("</ul", i);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      // ensure it's a real tag start
      depth++;
      i = nextOpen + 3;
      continue;
    }
    // close
    depth--;
    const closeEnd = html.indexOf(">", nextClose);
    if (closeEnd === -1) return null;
    i = closeEnd + 1;
    if (depth === 0) return { start: ulOpenIdx, end: i };
  }
  return null;
}

function ensureLinks(html) {
  const ulOpenRe =
    /<ul[^>]*id=["']menu-home["'][^>]*class=["'][^"']*\bmenu\b[^"']*["'][^>]*>/i;
  const m = html.match(ulOpenRe);
  if (!m) return html;
  const ulOpenIdx = html.indexOf(m[0]);
  const range = findMatchingUl(html, ulOpenIdx);
  if (!range) return html;

  const block = html.slice(range.start, range.end);
  const closeIdx = block.lastIndexOf("</ul");
  if (closeIdx === -1) return html;

  let before = block.slice(0, closeIdx);
  let after = block.slice(closeIdx);

  // Remove any existing Privacy/About items (we will append them at the end).
  before = before.replace(
    /\s*<li[^>]*\bmenu-item-privacy\b[\s\S]*?<\/li>\s*/gi,
    "\n"
  );
  before = before.replace(
    /\s*<li[^>]*\bmenu-item-about\b[\s\S]*?<\/li>\s*/gi,
    "\n"
  );
  before = before.replace(
    /\s*<li[^>]*\bmenu-item-contact\b[\s\S]*?<\/li>\s*/gi,
    "\n"
  );

  const insertion = [
    "",
    "              <li class=\"menu-item menu-item-type-custom menu-item-object-custom menu-item-privacy\">",
    "                <a href=\"/privacy-policy.html\" style=\"cursor: pointer\">Privacy</a>",
    "              </li>",
    "              <li class=\"menu-item menu-item-type-custom menu-item-object-custom menu-item-about\">",
    "                <a href=\"/about.html\" style=\"cursor: pointer\">About</a>",
    "              </li>",
    "              <li class=\"menu-item menu-item-type-custom menu-item-object-custom menu-item-contact\">",
    "                <a href=\"/contact.html\" style=\"cursor: pointer\">Contact</a>",
    "              </li>",
    "",
  ].join("\n");

  const nextBlock = before.trimEnd() + insertion + after;
  return html.slice(0, range.start) + nextBlock + html.slice(range.end);
}

const dry = process.argv.includes("--dry-run");
let changed = 0;
for (const f of walkHtml(ROOT)) {
  if (path.relative(ROOT, f).startsWith("tools")) continue;
  const orig = fs.readFileSync(f, "utf8");
  const next = ensureLinks(orig);
  if (next !== orig) {
    changed++;
    if (!dry) fs.writeFileSync(f, next, "utf8");
    console.log(dry ? "[dry] would update:" : "updated:", path.relative(ROOT, f));
  }
}
console.log(dry ? `Done dry-run, ${changed} file(s) would change.` : `Done, ${changed} file(s) updated.`);

