/**
 * Inject an inline comment-submit handler into every HTML page that has a comment form.
 * This is a fallback when external JS fails to load on some hosts.
 *
 * It:
 * - Enables disabled "Post Comment" button
 * - Validates Name/Email/Comment
 * - Shows a small toast ("Sent successfully" / error)
 * - Prevents actual submission (static site)
 *
 * Run:
 *   node tools/inject-inline-comment-toast.mjs
 * Dry-run:
 *   node tools/inject-inline-comment-toast.mjs --dry-run
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

const MARK = "data-crawlarc-inline-comment-toast";

const INLINE = `\n<script ${MARK}=\"1\">\n(function(){\n  function toast(msg, kind){\n    var el=document.getElementById('crawlarc-inline-toast');\n    if(!el){\n      el=document.createElement('div');\n      el.id='crawlarc-inline-toast';\n      el.setAttribute('role','status');\n      el.setAttribute('aria-live','polite');\n      el.style.cssText='position:fixed;left:50%;top:16px;transform:translateX(-50%) translateY(-14px);z-index:13000;padding:12px 16px;border-radius:12px;background:rgba(18,23,34,.92);color:#fff;font:650 15px/1.25 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.28);opacity:0;pointer-events:none;transition:opacity 180ms ease,transform 180ms ease;max-width:min(92vw,520px);text-align:center;';\n      document.body.appendChild(el);\n    }\n    el.textContent=msg;\n    if(kind==='error') el.style.background='rgba(160, 30, 30, .92)';\n    else el.style.background='rgba(18,23,34,.92)';\n    el.style.opacity='0';\n    el.style.transform='translateX(-50%) translateY(-14px)';\n    void el.offsetWidth;\n    el.style.opacity='1';\n    el.style.transform='translateX(-50%) translateY(0)';\n    clearTimeout(toast._t);\n    toast._t=setTimeout(function(){el.style.opacity='0';el.style.transform='translateX(-50%) translateY(-14px)';},1800);\n  }\n\n  function markError(el){\n    if(!el) return;\n    el.style.borderColor='#d93a3a';\n    el.style.boxShadow='0 0 0 3px rgba(217,58,58,.18)';\n    el.setAttribute('aria-invalid','true');\n  }\n  function clearError(el){\n    if(!el) return;\n    el.style.borderColor='';\n    el.style.boxShadow='';\n    el.removeAttribute('aria-invalid');\n  }\n\n  function validate(form){\n    var author=form.querySelector('#author');\n    var email=form.querySelector('#email');\n    var comment=form.querySelector('#comment');\n    clearError(author); clearError(email); clearError(comment);\n    var missing=[];\n    var nameVal=author?String(author.value||'').trim():'';\n    var emailVal=email?String(email.value||'').trim():'';\n    var commentVal=comment?String(comment.value||'').trim():'';\n    if(!nameVal){missing.push('Name'); markError(author);} \n    if(!emailVal){missing.push('Email'); markError(email);} else {\n      var ok=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(emailVal);\n      if(!ok){missing.push('a valid Email'); markError(email);} \n    }\n    if(!commentVal){missing.push('Comment'); markError(comment);} \n    if(missing.length){toast('Please enter: '+missing.join(', '),'error'); return false;}\n    return true;\n  }\n\n  function wire(form){\n    if(form.getAttribute('data-crawlarc-wired')==='1') return;\n    form.setAttribute('data-crawlarc-wired','1');\n    var btn=form.querySelector('#submit, input[type=\"submit\"]');\n    if(btn && btn.hasAttribute('disabled')) btn.removeAttribute('disabled');\n    form.addEventListener('submit',function(e){e.preventDefault(); if(!validate(form)) return; toast('Sent successfully');});\n    form.addEventListener('click',function(e){\n      var t=e.target && e.target.closest ? e.target.closest('#submit, input[type=\"submit\"]') : null;\n      if(t){e.preventDefault(); if(!validate(form)) return; toast('Sent successfully');}\n    });\n  }\n\n  function boot(){\n    var forms=document.querySelectorAll('form#commentform, form.comment-form');\n    for(var i=0;i<forms.length;i++) wire(forms[i]);\n  }\n\n  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);\n  else boot();\n})();\n</script>\n`;

function inject(html) {
  if (!/id=["']commentform["']|class=["']comment-form["']/i.test(html))
    return html;
  if (html.includes(MARK)) return html;
  if (!/<\/body>/i.test(html)) return html;
  return html.replace(/<\/body>/i, INLINE + "</body>");
}

let changed = 0;
for (const file of walkHtml(ROOT)) {
  if (path.relative(ROOT, file).startsWith("tools")) continue;
  const orig = fs.readFileSync(file, "utf8");
  const next = inject(orig);
  if (next !== orig) {
    changed++;
    if (!dry) fs.writeFileSync(file, next, "utf8");
    console.log(dry ? "[dry] would update:" : "updated:", path.relative(ROOT, file));
  }
}

console.log(
  dry ? `Done dry-run, ${changed} file(s) would change.` : `Done, ${changed} file(s) updated.`
);

