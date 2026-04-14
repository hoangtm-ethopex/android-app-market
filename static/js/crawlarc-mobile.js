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
    wireCommentSuccessToast();
    syncLayout();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
