(function () {
  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function enhanceBottomShareBoxes() {
    var boxes = document.querySelectorAll(
      ".bottomcontainerBox:not([data-crawlarc-share])"
    );
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var article = box.closest("article") || box.closest(".hentry");
      var pageUrl = window.location.href;
      var title = document.title || "";
      if (article) {
        var link = article.querySelector(".entry-title a[href]");
        if (link && link.href) pageUrl = link.href;
        var titleEl = article.querySelector(".entry-title");
        if (titleEl) {
          var t = titleEl.textContent.replace(/\s+/g, " ").trim();
          if (t) title = t;
        }
      }
      var fb =
        "https://www.facebook.com/sharer/sharer.php?" +
        new URLSearchParams({ u: pageUrl }).toString();
      var tw =
        "https://twitter.com/intent/tweet?" +
        new URLSearchParams({
          text: title,
          url: pageUrl,
          via: "AndroidAppMarkt",
        }).toString();
      var html =
        '<div class="bottomcontainerBox" data-crawlarc-share="1" style="background-color: #f9f9f9; padding: 7px 11px; border-top: 1px solid #e0e0e0; margin-top: 10px; display: flex; align-items: center; gap: 8px;">' +
        '<a href="' +
        escapeAttr(fb) +
        '" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:4px; background:#1877f2; color:#fff; text-decoration:none; padding:4px 9px; border-radius:3px; font-size:11px; font-family:sans-serif;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>' +
        "Like" +
        "</a>" +
        '<a href="' +
        escapeAttr(tw) +
        '" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:4px; background:#1da1f2; color:#fff; text-decoration:none; padding:4px 9px; border-radius:3px; font-size:11px; font-family:sans-serif;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>' +
        "Tweet" +
        "</a>" +
        "</div>";
      var tpl = document.createElement("template");
      tpl.innerHTML = html;
      var next = tpl.content.firstElementChild;
      if (next && box.parentNode) box.parentNode.replaceChild(next, box);
    }
  }

  var mq = window.matchMedia("(max-width: 768px)");
  var inner = document.getElementById("off-canvas-inner");
  var navAnchor = document.getElementById("masthead-nav-anchor");
  var secondaryAnchor = document.getElementById("secondary-main-anchor");
  var nav = document.getElementById("access");
  var secondary = document.getElementById("secondary");
  var drawer = document.getElementById("off-canvas-drawer");
  var backdrop = document.getElementById("off-canvas-backdrop");
  var openBtn = document.getElementById("drawer-open-btn");
  var closeBtn = document.getElementById("drawer-close-btn");

  function closeDrawer() {
    document.body.classList.remove("drawer-open");
    if (drawer) {
      drawer.setAttribute("aria-hidden", "true");
    }
    if (backdrop) backdrop.setAttribute("aria-hidden", "true");
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function openDrawer() {
    document.body.classList.add("drawer-open");
    if (drawer) {
      drawer.setAttribute("aria-hidden", "false");
    }
    if (backdrop) backdrop.setAttribute("aria-hidden", "false");
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (closeBtn) closeBtn.focus();
  }

  function syncLayout() {
    var mobile = mq.matches;
    document.body.classList.toggle("layout-mobile-ready", mobile);
    if (!inner || !nav || !secondary || !navAnchor || !secondaryAnchor) return;
    if (mobile) {
      inner.appendChild(nav);
      inner.appendChild(secondary);
    } else {
      closeDrawer();
      navAnchor.appendChild(nav);
      secondaryAnchor.appendChild(secondary);
    }
  }

  if (mq.addEventListener) mq.addEventListener("change", syncLayout);
  else if (mq.addListener) mq.addListener(syncLayout);

  openBtn &&
    openBtn.addEventListener("click", function () {
      openDrawer();
    });
  closeBtn &&
    closeBtn.addEventListener("click", function () {
      closeDrawer();
      if (openBtn) openBtn.focus();
    });
  backdrop &&
    backdrop.addEventListener("click", function () {
      closeDrawer();
      if (openBtn) openBtn.focus();
    });
  inner &&
    inner.addEventListener("click", function (e) {
      if (e.target.closest("a[href]")) closeDrawer();
    });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeDrawer();
      if (openBtn && mq.matches) openBtn.focus();
    }
  });

  function boot() {
    enhanceBottomShareBoxes();
    syncLayout();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
