(function () {
  function initGoogleTagManager() {
    if (window.__crawlarcGtmInstalled) return;
    window.__crawlarcGtmInstalled = true;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

    var firstScript = document.getElementsByTagName("script")[0];
    var gtmScript = document.createElement("script");
    gtmScript.async = true;
    gtmScript.src =
      "https://www.googletagmanager.com/gtm.js?id=GTM-NHRV324P";

    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(gtmScript, firstScript);
    } else if (document.head) {
      document.head.appendChild(gtmScript);
    }

    if (document.body && !document.getElementById("gtm-noscript-iframe")) {
      var noscript = document.createElement("noscript");
      var iframe = document.createElement("iframe");
      iframe.id = "gtm-noscript-iframe";
      iframe.src =
        "https://www.googletagmanager.com/ns.html?id=GTM-NHRV324P";
      iframe.height = "0";
      iframe.width = "0";
      iframe.style.display = "none";
      iframe.style.visibility = "hidden";
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);
    }
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function enhanceBottomShareBoxes() {
    if (typeof URLSearchParams !== "function") return;
    var boxes = document.querySelectorAll(
      ".bottomcontainerBox:not([data-crawlarc-share])"
    );
    for (var i = 0; i < boxes.length; i++) {
      try {
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
          '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>' +
          "Tweet" +
          "</a>" +
          "</div>";
        var tpl = document.createElement("template");
        tpl.innerHTML = html;
        var next = tpl.content.firstElementChild;
        if (next && box.parentNode) box.parentNode.replaceChild(next, box);
      } catch (e) {
        // ignore per-box errors so other features keep working
      }
    }
  }

  function fixArchivedImages() {
    var placeholder = "/static/images/image-placeholder.svg";

    function extractOriginalUrl(archivedUrl) {
      // Typical: https://web.archive.org/web/<timestamp>/<original>
      var m = String(archivedUrl || "").match(
        /^https?:\/\/web\.archive\.org\/web\/\d+\/(https?:\/\/.+)$/i
      );
      return m && m[1] ? m[1] : "";
    }

    function toLocalPathIfPossible(originalUrl) {
      try {
        var u = new URL(originalUrl);
        // Most pages in this archive are served from repo root, so path is the best guess.
        return u.pathname || "";
      } catch (e) {
        return "";
      }
    }

    function setFallback(img) {
      if (!img || img.getAttribute("data-crawlarc-img-fallback") === "1") return;
      img.setAttribute("data-crawlarc-img-fallback", "1");
      img.classList.add("crawlarc-img-fallback");
      img.src = placeholder;
      img.removeAttribute("srcset");
    }

    function tryRewrite(img) {
      if (!img || img.getAttribute("data-crawlarc-img-checked") === "1") return;
      img.setAttribute("data-crawlarc-img-checked", "1");

      var src = img.getAttribute("src") || "";
      if (!src) return;

      // If it's a Wayback URL, replace it immediately (bulk fix).
      // This avoids broken remote fetches and ensures a consistent local UI.
      if (/^https?:\/\/web\.archive\.org\/web\//i.test(src)) {
        var original = extractOriginalUrl(src) || src;
        img.setAttribute("data-crawlarc-img-original", original);
        img.removeAttribute("srcset");
        img.src = placeholder;
        img.classList.add("crawlarc-img-fallback");
        return;
      }

      // If it fails to load, swap to placeholder.
      img.addEventListener(
        "error",
        function () {
          setFallback(img);
        },
        { once: true }
      );
    }

    // Existing images
    var imgs = document.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) tryRewrite(imgs[i]);

    // Future images (some pages inject content)
    if (window.MutationObserver) {
      try {
        var mo = new MutationObserver(function (mutations) {
          for (var k = 0; k < mutations.length; k++) {
            var m = mutations[k];
            if (!m.addedNodes) continue;
            for (var n = 0; n < m.addedNodes.length; n++) {
              var node = m.addedNodes[n];
              if (!node || node.nodeType !== 1) continue;
              if (node.tagName === "IMG") tryRewrite(node);
              var nested = node.querySelectorAll
                ? node.querySelectorAll("img")
                : null;
              if (nested && nested.length) {
                for (var z = 0; z < nested.length; z++) tryRewrite(nested[z]);
              }
            }
          }
        });
        mo.observe(document.documentElement || document.body, {
          childList: true,
          subtree: true,
        });
      } catch (e) {}
    }
  }

  function ensureToastNode() {
    var existing = document.getElementById("crawlarc-toast");
    if (existing) return existing;
    var el = document.createElement("div");
    el.id = "crawlarc-toast";
    el.className = "crawlarc-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
    return el;
  }

  function showToast(message) {
    var el = ensureToastNode();
    el.textContent = message;
    el.classList.remove("is-visible");
    // force reflow so transition restarts
    void el.offsetWidth;
    el.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () {
      el.classList.remove("is-visible");
    }, 1800);
  }

  function wireCommentSuccessToast() {
    var forms = document.querySelectorAll(
      "form#commentform, form.comment-form"
    );
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (form.getAttribute("data-crawlarc-toast") === "1") continue;
      form.setAttribute("data-crawlarc-toast", "1");

      // Enable the button so users can click in this static archive
      var submit = form.querySelector("#submit, input[type='submit']");
      if (submit && submit.hasAttribute("disabled"))
        submit.removeAttribute("disabled");

      var author = form.querySelector("#author");
      var email = form.querySelector("#email");
      var comment = form.querySelector("#comment");

      function clearFieldError(el) {
        if (!el) return;
        el.classList.remove("crawlarc-field-error");
        el.removeAttribute("aria-invalid");
      }
      function setFieldError(el) {
        if (!el) return;
        el.classList.add("crawlarc-field-error");
        el.setAttribute("aria-invalid", "true");
      }

      function validate() {
        clearFieldError(author);
        clearFieldError(email);
        clearFieldError(comment);

        var missing = [];
        var nameVal = author ? String(author.value || "").trim() : "";
        var emailVal = email ? String(email.value || "").trim() : "";
        var commentVal = comment ? String(comment.value || "").trim() : "";

        if (!nameVal) {
          missing.push("Name");
          setFieldError(author);
        }
        if (!emailVal) {
          missing.push("Email");
          setFieldError(email);
        } else {
          var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
          if (!emailOk) {
            missing.push("a valid Email");
            setFieldError(email);
          }
        }
        if (!commentVal) {
          missing.push("Comment");
          setFieldError(comment);
        }

        if (missing.length) {
          showToast("Please enter: " + missing.join(", "));
          return false;
        }
        return true;
      }

      author &&
        author.addEventListener("input", function () {
          clearFieldError(author);
        });
      email &&
        email.addEventListener("input", function () {
          clearFieldError(email);
        });
      comment &&
        comment.addEventListener("input", function () {
          clearFieldError(comment);
        });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validate()) return;
        showToast("Sent successfully");
      });

      form.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest && e.target.closest("#submit");
        if (btn) {
          e.preventDefault();
          if (!validate()) return;
          showToast("Sent successfully");
        }
      });
    }
  }

  function setActiveMenuItem() {
    var nav = document.getElementById("access");
    if (!nav) return;

    var path = (window.location && window.location.pathname) || "";
    try {
      path = decodeURIComponent(path);
    } catch (e) {}

    var isFile = /^file:/i.test(window.location.protocol || "");

    /** file:// resolves /foo wrongly against a local path; derive site-relative path and compare href strings. */
    function fileUrlSitePath() {
      var raw = path.replace(/\\/g, "/");
      var parts = raw.split("/").filter(function (x) {
        return x && x !== "." && x !== "..";
      });
      var cut = -1;
      for (var i = 0; i < parts.length; i++) {
        if (/android-app-market/i.test(parts[i])) {
          cut = i;
          break;
        }
      }
      var tail =
        cut >= 0 ? parts.slice(cut + 1) : parts.length ? [parts[parts.length - 1]] : [];
      if (!tail.length) return "/";
      return norm("/" + tail.join("/"));
    }

    function hrefToNavPath(href) {
      if (!href) return "";
      if (href.indexOf("http://") === 0 || href.indexOf("https://") === 0)
        return "";
      if (href.charAt(0) !== "/") return "";
      if (isFile) return norm(href);
      try {
        return norm(new URL(href, window.location.href).pathname);
      } catch (e) {
        return norm(href);
      }
    }

    function norm(p) {
      if (!p) return "/";
      // strip query/hash if passed in
      p = String(p).split("#")[0].split("?")[0];
      // collapse duplicate slashes
      p = p.replace(/\/{2,}/g, "/");
      // treat /foo/index.html as /foo/
      p = p.replace(/\/index\.html$/i, "/");
      // treat /index.html as /
      p = p.replace(/^\/index\.html$/i, "/");
      // keep as-is (do not force trailing slash); handle variants below
      return p;
    }

    function variants(p) {
      p = norm(p);
      var out = {};
      function add(x) {
        if (x == null) return;
        x = String(x);
        if (!x) return;
        out[x] = true;
      }
      add(p);
      // with/without trailing slash
      if (p !== "/" && /\/$/.test(p)) add(p.replace(/\/+$/, ""));
      if (p !== "/" && !/\/$/.test(p) && !/\.html$/i.test(p)) add(p + "/");
      // /foo/index.html forms
      if (p !== "/" && /\/$/.test(p)) add(p.replace(/\/+$/, "") + "/index.html");
      if (p !== "/" && !/\/$/.test(p) && !/\.html$/i.test(p)) add(p + "/index.html");
      return out;
    }

    var topMenuLis = nav.querySelectorAll("#menu-home > li");
    for (var ti = 0; ti < topMenuLis.length; ti++) {
      topMenuLis[ti].classList.remove("crawlarc-nav-parent-active");
    }
    var mobDetails = nav.querySelectorAll(".nav-android-news--mobile");
    for (var pd = 0; pd < mobDetails.length; pd++) {
      mobDetails[pd].classList.remove("crawlarc-nav-parent-active");
    }

    var links = nav.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.remove("crawlarc-menu-active");
      var li = links[i].closest("li");
      if (li) {
        li.classList.remove("crawlarc-menu-active");
        // Remove theme active classes so we don't end up with multiple "current" items
        li.classList.remove("current-menu-item");
        li.classList.remove("current_page_item");
      }
      var details = links[i].closest && links[i].closest("details");
      if (details) details.classList.remove("crawlarc-menu-active");
    }

    function stripLeadingSlash(p) {
      return String(p || "").replace(/^\/+/, "");
    }

    /**
     * Submenu Android News (Phones, Tablets, …): khớp URL/category → đậm nhãn cha.
     */
    function matchAndroidNewsSubmenu(curResolved, catPathNorm) {
      var root = nav.querySelector("#menu-home > li.menu-item-has-children");
      if (!root) return null;
      var subAnchors = root.querySelectorAll("ul.sub-menu a[href]");
      var bestA = null;
      var bestScore = 0;

      for (var i = 0; i < subAnchors.length; i++) {
        var ax = subAnchors[i];
        var href = ax.getAttribute("href");
        if (!href) continue;
        if (href.indexOf("http://") === 0 || href.indexOf("https://") === 0)
          continue;
        var target = hrefToNavPath(href);
        if (!target) continue;

        function scoreAgainst(curR) {
          if (!curR || curR === "/") return 0;
          var curVs = variants(curR);
          var targetVs = variants(target);

          if (curVs[target] || targetVs[curR]) return 4000 + target.length;

          if (
            target !== "/" &&
            (String(curR).indexOf(target) === 0 ||
              (targetVs[String(curR)] ? true : false))
          )
            return 2500 + target.length;

          var curNoLead = stripLeadingSlash(curR);
          var targetNoLead = stripLeadingSlash(target);
          if (
            target !== "/" &&
            (curNoLead === targetNoLead ||
              curNoLead.endsWith(targetNoLead) ||
              targetNoLead.endsWith(curNoLead))
          )
            return 1500 + targetNoLead.length;
          return 0;
        }

        var s = scoreAgainst(norm(curResolved));
        if (catPathNorm) {
          s = Math.max(s, scoreAgainst(norm(catPathNorm)));
        }
        if (s > bestScore) {
          bestScore = s;
          bestA = ax;
        }
      }
      return bestScore ? bestA : null;
    }

    function matchNavLinkToPath(curResolved) {
      var curVs = variants(curResolved);
      var bl = null;
      var len = -1;
      for (var j = 0; j < links.length; j++) {
        var a = links[j];
        var href = a.getAttribute("href");
        if (!href) continue;
        if (href.indexOf("http://") === 0 || href.indexOf("https://") === 0)
          continue;
        if (href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0)
          continue;

        var target = hrefToNavPath(href);
        if (!target) continue;
        var targetVs = variants(target);

        // exact match across variants (handles trailing slash differences)
        if (curVs[target] || targetVs[curResolved]) {
          bl = a;
          len = target.length;
          break;
        }
        // fallback: longest prefix match across variants (useful for section pages)
        if (
          target !== "/" &&
          (String(curResolved).indexOf(target) === 0 ||
            (targetVs[String(curResolved)] ? true : false)) &&
          target.length > len
        ) {
          bl = a;
          len = target.length;
        }

        // host-in-subfolder fallback: compare by suffix
        var curNoLead = stripLeadingSlash(curResolved);
        var targetNoLead = stripLeadingSlash(target);
        if (
          target !== "/" &&
          (curNoLead === targetNoLead ||
            curNoLead.endsWith(targetNoLead) ||
            targetNoLead.endsWith(curNoLead)) &&
          targetNoLead.length > len
        ) {
          bl = a;
          len = targetNoLead.length;
        }
      }
      return bl;
    }

    var catHrefNormSingle = "";
    if (
      document.body &&
      document.body.classList.contains("single-post")
    ) {
      var catA0 = document.querySelector(
        '#primary .hentry .cat-links a[href^="/"]'
      );
      var catH0 = catA0 ? catA0.getAttribute("href") : "";
      if (catH0) {
        var cpnEarly = hrefToNavPath(catH0);
        if (cpnEarly) catHrefNormSingle = cpnEarly;
      }
    }

    var cur = isFile ? fileUrlSitePath() : norm(path);
    var bestLink = matchNavLinkToPath(cur);

    if (!bestLink) {
      var metaEl = document.querySelector('meta[name="nav-section"]');
      var hintRaw = metaEl
        ? String(metaEl.getAttribute("content") || "").trim()
        : "";
      if (hintRaw) {
        var hintNorm = "";
        try {
          if (/^https?:\/\//i.test(hintRaw)) {
            hintNorm = norm(new URL(hintRaw).pathname);
          } else {
            hintNorm = norm(
              hintRaw.charAt(0) === "/" ? hintRaw : "/" + hintRaw
            );
          }
        } catch (e) {
          hintNorm = "";
        }
        if (hintNorm) {
          bestLink = matchNavLinkToPath(hintNorm);
        }
      }
    }

    if (!bestLink && catHrefNormSingle) {
      bestLink = matchNavLinkToPath(catHrefNormSingle);
    }

    var androidNewsHit = matchAndroidNewsSubmenu(cur, catHrefNormSingle);
    if (androidNewsHit) {
      bestLink = androidNewsHit;
    }

    if (bestLink) {
      bestLink.classList.add("crawlarc-menu-active");
      var bestLi = bestLink.closest("li");
      if (bestLi) {
        bestLi.classList.add("crawlarc-menu-active");
        // Also apply the theme's built-in "current" styling (defined in static/css/all.css)
        bestLi.classList.add("current-menu-item");
        bestLi.classList.add("current_page_item");
      }

      var parentSection =
        bestLink.closest &&
        bestLink.closest("#menu-home > li.menu-item-has-children");
      if (parentSection) {
        parentSection.classList.add("crawlarc-nav-parent-active");
        var mobD = parentSection.querySelector(".nav-android-news--mobile");
        if (mobD) {
          mobD.classList.add("crawlarc-nav-parent-active");
        }
      }

      // Không mở accordion — menu con ẩn sau khi đã chọn trang
      var bestDetails = bestLink.closest && bestLink.closest("details");
      if (bestDetails) {
        bestDetails.classList.add("crawlarc-menu-active");
        try {
          bestDetails.open = false;
        } catch (e) {}
      }
    }
  }

  function wireMenuActiveOnClick() {
    var nav = document.getElementById("access");
    if (!nav) return;
    if (nav.getAttribute("data-crawlarc-active-wire") === "1") return;
    nav.setAttribute("data-crawlarc-active-wire", "1");

    nav.addEventListener(
      "click",
      function (e) {
        var a = e.target && e.target.closest && e.target.closest("a[href]");
        if (!a) return;
        var href = a.getAttribute("href");
        if (!href || /^(https?:|mailto:|tel:)/i.test(href)) return;

        try {
          var topLisClear = nav.querySelectorAll("#menu-home > li");
          for (var tc = 0; tc < topLisClear.length; tc++) {
            topLisClear[tc].classList.remove("crawlarc-nav-parent-active");
          }
          var mobDClr = nav.querySelectorAll(".nav-android-news--mobile");
          for (var md = 0; md < mobDClr.length; md++) {
            mobDClr[md].classList.remove("crawlarc-nav-parent-active");
          }
          var links2 = nav.querySelectorAll("a[href]");
          for (var i = 0; i < links2.length; i++) {
            links2[i].classList.remove("crawlarc-menu-active");
            var liClr = links2[i].closest("li");
            if (liClr) {
              liClr.classList.remove("crawlarc-menu-active");
              liClr.classList.remove("current-menu-item");
              liClr.classList.remove("current_page_item");
            }
            var det =
              links2[i].closest && links2[i].closest("details");
            if (det) det.classList.remove("crawlarc-menu-active");
          }
        } catch (err) {}

        a.classList.add("crawlarc-menu-active");
        var li = a.closest && a.closest("li");
        if (li) {
          li.classList.add("crawlarc-menu-active");
          li.classList.add("current-menu-item");
          li.classList.add("current_page_item");
        }
        var clickedParent =
          a.closest && a.closest("#menu-home > li.menu-item-has-children");
        if (clickedParent) {
          var inSubDesktop =
            li &&
            li.parentElement &&
            li.parentElement.classList.contains("nav-android-submenu--desktop");
          var inSubMobile =
            li &&
            li.parentElement &&
            li.parentElement.classList.contains("sub-menu") &&
            a.closest(".nav-news-details");
          if ((inSubDesktop || inSubMobile) && clickedParent.contains(li)) {
            clickedParent.classList.add("crawlarc-nav-parent-active");
            var mobDW = clickedParent.querySelector(".nav-android-news--mobile");
            if (mobDW) {
              mobDW.classList.add("crawlarc-nav-parent-active");
            }
          }
        }
        var clickedDetails = a.closest && a.closest("details");
        if (clickedDetails) clickedDetails.classList.add("crawlarc-menu-active");
        var acc = a.closest && a.closest("details.nav-android-news--mobile");
        if (acc) {
          try {
            acc.open = false;
          } catch (er) {}
        }
      },
      true
    );
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
    if (mobile) {
      if (inner && nav && navAnchor) inner.appendChild(nav);
      if (inner && secondary) inner.appendChild(secondary);
    } else {
      closeDrawer();
      if (nav && navAnchor) navAnchor.appendChild(nav);
      if (secondary && secondaryAnchor) secondaryAnchor.appendChild(secondary);
    }
    try {
      setActiveMenuItem();
    } catch (e) {}
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
    try {
      initGoogleTagManager();
    } catch (e) {}
    try {
      wireCommentSuccessToast();
    } catch (e) {}
    try {
      enhanceBottomShareBoxes();
    } catch (e) {}
    try {
      fixArchivedImages();
    } catch (e) {}
    try {
      syncLayout();
    } catch (e) {}
    try {
      setActiveMenuItem();
    } catch (e) {}
    try {
      wireMenuActiveOnClick();
    } catch (e) {}
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // Handle BFCache restore / SPA-like navigation
  window.addEventListener &&
    window.addEventListener("pageshow", function () {
      try {
        setActiveMenuItem();
      } catch (e) {}
    });
  window.addEventListener &&
    window.addEventListener("popstate", function () {
      try {
        setActiveMenuItem();
      } catch (e) {}
    });
})();
