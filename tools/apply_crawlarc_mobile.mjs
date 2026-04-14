/**
 * Áp dụng layout mobile (CSS + JS + markup drawer/nav/secondary/Android News)
 * cho mọi file .html dưới thư mục gốc dự án (trừ .git).
 *
 * Chạy từ thư mục gốc CrawlArc:
 *   node tools/apply_crawlarc_mobile.mjs
 * Dry-run (chỉ in tên file sẽ sửa):
 *   node tools/apply_crawlarc_mobile.mjs --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LI637 = fs.readFileSync(
  path.join(__dirname, "snippets", "li-menu-637.html"),
  "utf8"
);

const DRAWER = `    <div
      class="off-canvas-backdrop"
      id="off-canvas-backdrop"
      aria-hidden="true"
    ></div>
    <aside
      class="off-canvas-drawer"
      id="off-canvas-drawer"
      aria-hidden="true"
      aria-label="Menu và tiện ích"
    >
      <div class="off-canvas-drawer__header">
        <span class="off-canvas-drawer__title">Menu</span>
        <button
          type="button"
          class="off-canvas-drawer__close"
          id="drawer-close-btn"
          aria-label="Đóng menu"
        >
          ×
        </button>
      </div>
      <div class="off-canvas-drawer__scroll" id="off-canvas-inner"></div>
    </aside>
`;

const HAMBURGER = `        <button
          type="button"
          class="drawer-hamburger"
          id="drawer-open-btn"
          aria-controls="off-canvas-drawer"
          aria-expanded="false"
          aria-label="Mở menu"
        >
          <span class="drawer-hamburger__bar" aria-hidden="true"></span>
          <span class="drawer-hamburger__bar" aria-hidden="true"></span>
          <span class="drawer-hamburger__bar" aria-hidden="true"></span>
        </button>
`;

const CSS_LINK = `    <link rel="stylesheet" href="/static/css/crawlarc-mobile.css" />
  `;

const VIEWPORT = `    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />`;

const SCRIPT = `    <script src="/static/js/crawlarc-mobile.js" defer></script>
`;

function* walkHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === ".git" || e.name === "node_modules") continue;
      yield* walkHtml(full);
    } else if (e.isFile() && e.name.endsWith(".html")) {
      yield full;
    }
  }
}

function patchViewport(html) {
  if (/<meta[^>]*name=["']viewport["']/i.test(html)) {
    return html.replace(
      /<meta[^>]*name=["']viewport["'][^>]*\/?>/i,
      VIEWPORT.trim()
    );
  }
  return html.replace(
    /(<meta\s+charset=["']UTF-8["']\s*\/?>)/i,
    `$1\n${VIEWPORT}`
  );
}

function injectCssLink(html) {
  if (html.includes("crawlarc-mobile.css")) return html;
  return html.replace(/<\/head>/i, `${CSS_LINK}</head>`);
}

function stripEmbeddedMobileStyles(html) {
  if (!html.includes('id="nav-accordion-sidebar"')) return html;
  return html.replace(
    /<style type="text\/css" id="nav-accordion-sidebar">[\s\S]*?<\/style>\s*\n\s*<style type="text\/css" id="off-canvas-drawer">[\s\S]*?<\/style>\s*\n\s*<style type="text\/css" id="mobile-layout">[\s\S]*?<\/style>\s*\n?/i,
    ""
  );
}

function stripInlineDrawerScript(html) {
  return html.replace(
    /<script>[\s\S]*?getElementById\("off-canvas-inner"\)[\s\S]*?<\/script>\s*/i,
    ""
  );
}

function injectDrawer(html) {
  if (html.includes('id="off-canvas-drawer"')) return html;
  const m = html.match(
    /(<div id="wm-ipp-print"[\s\S]*?<\/div>)(\s*\n\s*<div id="page")/i
  );
  if (!m) return html;
  return html.replace(m[0], `${m[1]}\n\n${DRAWER}\n${m[2]}`);
}

function injectHamburgerAndNav(html) {
  if (html.includes('id="masthead-nav-anchor"')) return html;
  if (!/<header id="masthead"/i.test(html) || !/<nav id="access"/i.test(html))
    return html;
  let h = html.replace(
    /(<header id="masthead"[^>]*>\s*)(<hgroup>)/i,
    `$1${HAMBURGER}$2`
  );
  h = h.replace(/(<\/hgroup>\s*)(<nav id="access")/i, `$1<div id="masthead-nav-anchor">\n        $2`);
  if (/<\/nav>\s*<!--\s*#access\s*-->/i.test(h)) {
    h = h.replace(
      /<\/nav>(\s*<!--\s*#access\s*-->)/i,
      `</nav>\n        </div>\n        $1`
    );
  } else {
    h = h.replace(/<\/nav>(\s*<\/header>)/i, `</nav>\n        </div>$1`);
  }
  return h;
}

function wrapSecondary(html) {
  if (html.includes('id="secondary-main-anchor"')) return html;
  if (!/<div id="secondary"/i.test(html)) return html;
  let h = html.replace(
    /<div id="secondary" class="widget-area"([^>]*)>/i,
    `<div id="secondary-main-anchor">\n        <div id="secondary" class="widget-area"$1>`
  );
  const reTypical =
    /\n        <\/div>\n        <!-- #secondary \.widget-area -->\n      <\/div>\s*\n\s*<!-- #main -->/i;
  if (reTypical.test(h)) {
    return h.replace(
      reTypical,
      "\n        </div>\n        </div>\n        <!-- #secondary .widget-area -->\n      </div>\n\n      <!-- #main -->"
    );
  }
  const reFallback =
    /(<div id="secondary-main-anchor">[\s\S]*?<!--\s*#secondary\s*\.widget-area\s*-->\s*\r?\n\s*<\/div>)(\s*\r?\n\s*<\/div>\s*\r?\n\s*<!--\s*#main\s*-->)/i;
  if (reFallback.test(h)) {
    h = h.replace(reFallback, `$1\n        </div>$2`);
  }
  return h;
}

function replaceAndroidNews(html) {
  if (html.includes("nav-android-news--desktop")) return html;
  const re =
    /<li[^>]*id=["']menu-item-637["'][^>]*>[\s\S]*?<\/li>\s*(?=<li[^>]*id=["']menu-item-655["'])/i;
  if (!re.test(html)) return html;
  return html.replace(re, LI637.trimEnd() + "\n              ");
}

function injectScript(html) {
  if (html.includes("crawlarc-mobile.js")) return html;
  return html.replace(/<\/body>/i, `${SCRIPT}</body>`);
}

function processFile(absPath, dry) {
  let html = fs.readFileSync(absPath, "utf8");
  const orig = html;

  html = stripEmbeddedMobileStyles(html);
  html = stripInlineDrawerScript(html);
  html = patchViewport(html);
  html = injectCssLink(html);
  html = injectDrawer(html);
  html = injectHamburgerAndNav(html);
  html = wrapSecondary(html);
  html = replaceAndroidNews(html);
  html = injectScript(html);

  if (html === orig) return false;
  if (!dry) fs.writeFileSync(absPath, html, "utf8");
  return true;
}

const dry = process.argv.includes("--dry-run");
let n = 0;
for (const f of walkHtml(ROOT)) {
  if (path.relative(ROOT, f).startsWith("tools")) continue;
  const rel = path.relative(ROOT, f);
  if (processFile(f, dry)) {
    n++;
    console.log(dry ? "[dry] would patch:" : "patched:", rel);
  }
}
console.log(dry ? `Done dry-run, ${n} file(s) would change.` : `Done, ${n} file(s) updated.`);
