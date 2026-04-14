/**
 * Một số file .html bị nối thêm đoạn rác sau thẻ </html> đóng (trùng #secondary, mẫu PowerShell `$after_prem`...).
 * Script: cắt mọi thứ sau </html> xuất hiện đầu tiên (giữ nguyên phần trước đó).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const OPEN_RE =
  /<div\s+id="secondary"\s+class="widget-area"\s+role="complementary">/gi;

function* walkHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkHtml(full);
    else if (e.isFile() && e.name.endsWith(".html")) yield full;
  }
}

function countSecondaryOpens(html) {
  const m = html.match(OPEN_RE) || [];
  OPEN_RE.lastIndex = 0;
  return m.length;
}

const dry = process.argv.includes("--dry-run");
let fixed = 0;

for (const file of walkHtml(ROOT)) {
  if (file.includes(`${path.sep}tools${path.sep}`)) continue;
  let html = fs.readFileSync(file, "utf8");
  if (countSecondaryOpens(html) < 2) continue;

  const marker = "</html>";
  const idx = html.indexOf(marker);
  if (idx === -1) continue;

  const trimmed = html.slice(0, idx + marker.length).replace(/\s+$/, "\n");
  if (trimmed === html.replace(/\s+$/, "\n")) continue;

  if (dry) {
    console.log("would strip:", path.relative(ROOT, file));
    continue;
  }

  fs.writeFileSync(file, trimmed, "utf8");
  fixed++;
  console.log("stripped:", path.relative(ROOT, file));
}

if (!dry) console.error("done, files written:", fixed);
