/* RedPine Lang Picker — universal language picker for RedPine client sites.
 *
 * Behaviour:
 *  - Modal interrupts the experience ~10s after page load (or sooner on scroll).
 *  - Title typewriter cycles "Choose your language" through every supported
 *    language, English first then random order.
 *  - Scrollable list of [flag · native name · pick] rows.
 *  - Floating FAB bottom-right is ALWAYS visible — shows the current language's
 *    flag, click re-opens the picker.
 *  - Language choice persisted in localStorage('rp-lang-v1').
 *  - Translations come from window.RP_LANG_DICT[langCode] (per-site dict).
 *    Languages without a dict show "Coming soon" badge and are disabled.
 *
 * Integration (per site):
 *   <link rel="stylesheet" href="/assets/lang-picker/lang-picker.css">
 *   <script src="/assets/lang-picker/languages.js"></script>
 *   <script>window.RP_LANG_PICKER_BASE = "/assets/lang-picker";
 *           window.RP_LANG_DICT = { es: { "Hello": "Hola", ... } };</script>
 *   <script src="/assets/lang-picker/lang-picker.js" defer></script>
 *
 *   Each site overrides the CSS variables in lang-picker.css via its own
 *   stylesheet (--rp-lp-accent, --rp-lp-display-font, etc.) so the picker
 *   inherits brand colours and fonts without code edits.
 */
(function () {
  "use strict";
  if (window.__RP_LANG_PICKER_LOADED) return;
  window.__RP_LANG_PICKER_LOADED = true;

  var STORE_KEY = "rp-lang-v1";
  var BASE = (window.RP_LANG_PICKER_BASE || "/assets/lang-picker").replace(/\/$/, "");
  var LIST = window.RP_LANG_LIST || [];
  var DICTS = window.RP_LANG_DICT || {};
  // Disclaimer key — its translation lives in each language's dict so the disclaimer
  // localises along with the page. Falls back to the English text if not in dict.
  var DISCLAIMER_KEY = "* Translations aren't always perfectly accurate.";
  if (!LIST.length) { console.warn("[rp-lang-picker] window.RP_LANG_LIST is empty"); return; }

  function flagSrc(iso) { return BASE + "/flags/" + iso + ".svg"; }
  function langByCode(code) { for (var i = 0; i < LIST.length; i++) if (LIST[i].code === code) return LIST[i]; return null; }
  function hasDict(code) { return code === "en" || (DICTS && DICTS[code]); }

  // ---------- DOM ----------
  function build() {
    var back = document.createElement("div");
    back.className = "rp-lang-back";
    back.id = "rp-lang-back";

    var modal = document.createElement("aside");
    modal.className = "rp-lang-modal";
    modal.id = "rp-lang-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "rp-lang-typewriter");

    var head = document.createElement("div");
    head.className = "rp-lang-modal-head";
    head.innerHTML =
      '<button type="button" class="rp-lang-close" aria-label="Close language picker" data-rp-lang-close>&times;</button>' +
      '<div class="rp-lang-typewriter" id="rp-lang-typewriter">' +
        '<span class="rp-lang-typed" data-rp-lang-typed>Choose your language</span>' +
      '</div>';
    modal.appendChild(head);

    var list = document.createElement("ul");
    list.className = "rp-lang-list";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Languages");

    var current = (localStorage.getItem(STORE_KEY) || "en");
    LIST.forEach(function (l) {
      var li = document.createElement("li");
      li.setAttribute("role", "presentation");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rp-lang-row";
      btn.setAttribute("role", "option");
      btn.setAttribute("data-rp-lang", l.code);
      btn.setAttribute("aria-current", current === l.code ? "true" : "false");
      var available = hasDict(l.code);
      if (!available) btn.setAttribute("aria-disabled", "true");
      btn.innerHTML =
        '<span class="rp-lang-flag"><img src="' + flagSrc(l.flag) + '" alt="' + escapeAttr(l.native) + ' flag" loading="lazy"/></span>' +
        '<span class="rp-lang-name"' + (l.dir === "rtl" ? ' dir="rtl"' : "") + '>' + escapeHtml(l.native) + '</span>' +
        '<span class="rp-lang-meta">' +
          (available ? "" : '<span class="rp-lang-coming">Coming soon</span>') +
        '</span>' +
        '<span class="rp-lang-check" aria-hidden="true"></span>';
      li.appendChild(btn);
      list.appendChild(li);
    });
    modal.appendChild(list);

    var disclaimer = document.createElement("p");
    disclaimer.className = "rp-lang-disclaimer";
    disclaimer.id = "rp-lang-disclaimer";
    disclaimer.textContent = DISCLAIMER_KEY;
    modal.appendChild(disclaimer);

    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "rp-lang-fab";
    fab.id = "rp-lang-fab";
    fab.setAttribute("aria-label", "Change language");
    var currentLang = langByCode(current) || LIST[0];
    fab.innerHTML =
      '<img src="' + flagSrc(currentLang.flag) + '" alt=""/>' +
      '<span class="rp-lang-fab-code">' + currentLang.code.toUpperCase() + '</span>' +
      '<span class="rp-lang-fab-caret" aria-hidden="true">▾</span>';

    document.body.appendChild(back);
    document.body.appendChild(modal);

    // Mount FAB inside the site's footer (far-right-bottom). Search priority:
    //   1. [data-rp-lang-slot]  — explicit slot the site provides
    //   2. last <footer>        — semantic
    //   3. .footer / .tt-footer-pro / [class*="footer"] — common patterns
    // The fab uses margin-left:auto so it floats to the right of whatever container it lands in.
    function mountFab() {
      var slot = document.querySelector("[data-rp-lang-slot]");
      if (!slot) {
        var footers = document.querySelectorAll("footer, .footer, .tt-footer-pro, [class*='footer-bottom'], [class*='footer-copyright']");
        if (footers.length) slot = footers[footers.length - 1];
      }
      if (!slot) slot = document.body;
      fab.setAttribute("data-rp-fab-host", slot.tagName.toLowerCase());
      slot.appendChild(fab);
    }
    if (document.readyState === "complete") mountFab();
    else window.addEventListener("load", mountFab, { once: true });

    return { back: back, modal: modal, fab: fab, list: list };
  }

  function updateFabFlag(code) {
    var fab = document.getElementById("rp-lang-fab");
    if (!fab) return;
    var lang = langByCode(code);
    if (!lang) return;
    var img = fab.querySelector("img");
    if (img) img.src = flagSrc(lang.flag);
    var codeSpan = fab.querySelector(".rp-lang-fab-code");
    if (codeSpan) codeSpan.textContent = lang.code.toUpperCase();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---------- Title cycler — opacity + slight vertical slide crossfade ----------
  // Replaces the original typewriter (which Diego found clunky). Each cycle:
  //   1. fade current text out + slide up 8px       (~360ms)
  //   2. swap text content + dir attr               (instant)
  //   3. prep new text below (translateY 8px, opacity 0)
  //   4. fade in + slide to rest                    (~360ms)
  //   5. dwell                                      (~2200ms)
  function shuffleSkipFirst(arr) {
    var rest = arr.slice(1).slice();
    for (var i = rest.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = rest[i]; rest[i] = rest[j]; rest[j] = t;
    }
    return [arr[0]].concat(rest);
  }

  function startTitleCycler(node) {
    var queue = shuffleSkipFirst(LIST);
    var idx = 0;

    function setText(lang) {
      node.textContent = lang.typeTitle;
      if (lang.dir === "rtl") node.setAttribute("dir", "rtl");
      else node.removeAttribute("dir");
    }

    setText(queue[0]);

    function tick() {
      if (!document.body.contains(node)) return;
      // Phase 1: fade out + slide up
      node.classList.add("rp-fade-out");
      setTimeout(function () {
        idx = (idx + 1) % queue.length;
        // Phase 2 + 3: swap content, prep below
        node.classList.remove("rp-fade-out");
        node.classList.add("rp-fade-in-prep");
        setText(queue[idx]);
        // Force a reflow so the prep state takes effect before transitioning
        void node.offsetWidth;
        // Phase 4: fade back in
        node.classList.remove("rp-fade-in-prep");
        // Phase 5: dwell, then loop
        setTimeout(tick, 2200);
      }, 380);
    }
    setTimeout(tick, 1800);
  }

  // ---------- Translation engine ----------
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, IFRAME: 1, NOSCRIPT: 1, SVG: 1, CODE: 1, PRE: 1 };
  var SKIP_IDS = { "rp-lang-back": 1, "rp-lang-modal": 1, "rp-lang-fab": 1 };
  // Closure-level translation state. Hoisted out of applyDict so the
  // MutationObserver below can keep translating dynamically-inserted DOM
  // (Webflow carousel slides, lazy-loaded panels, post-load animations).
  var ACTIVE_NORM_KEYS = null;
  var ACTIVE_NORM_MAP = null;
  var ACTIVE_OBSERVER = null;
  var WALKER_BUSY = false;  // true while we're mutating; observer ignores echo events

  // Normalize curly/typographic quotes & apostrophes to ASCII straight equivalents
  // so dictionary keys (typically authored with straight quotes) reliably match
  // page content (often rendered with smart-typography curly characters).
  function normQuotes(s) {
    return s
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[“”„‟]/g, '"')
      .replace(/–/g, "-")  // en dash → hyphen (use sparingly; only when content uses these as plain dashes)
      .replace(/—/g, "-"); // em dash → hyphen
  }

  // Translate a string. WHOLE-STRING match only — substring fallback was removed
  // after the live Top Taco Korean test caught "About us" → "소개 us" because
  // the dict had "About" alone and a 60% length-ratio guard let the partial
  // through. The fix: every visible string must exist as a whole-string key in
  // the dict. translation-check.mjs enforces the same rule at build time, so
  // any new copy that isn't yet translated is caught before it ships.
  function applyToString(t) {
    if (!t || !ACTIVE_NORM_MAP) return null;
    var nT = normQuotes(t.trim());
    if (!nT) return null;
    if (ACTIVE_NORM_MAP[nT]) {
      var lead = t.match(/^\s*/)[0];
      var tail = t.match(/\s*$/)[0];
      return lead + ACTIVE_NORM_MAP[nT].value + tail;
    }
    return null;
  }

  function isSkipped(el) {
    if (!el || el.nodeType !== 1) return false;
    if (SKIP_TAGS[el.tagName]) return true;
    if (el.id && SKIP_IDS[el.id]) return true;
    if (el.hasAttribute && el.hasAttribute("data-rp-no-translate")) return true;
    // Skip if any ancestor is opted out (matters for nodes added inside an opt-out subtree).
    var p = el.parentElement;
    while (p) {
      if (p.hasAttribute && p.hasAttribute("data-rp-no-translate")) return true;
      p = p.parentElement;
    }
    return false;
  }

  function walk(node) {
    if (!node) return;
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      if (!t || !t.trim()) return;
      var out = applyToString(t);
      if (out !== null && out !== t) {
        WALKER_BUSY = true;
        node.nodeValue = out;
        WALKER_BUSY = false;
      }
      return;
    }
    if (node.nodeType !== 1) return;
    if (isSkipped(node)) return;
    ["alt", "aria-label", "title", "placeholder"].forEach(function (a) {
      if (node.hasAttribute && node.hasAttribute(a)) {
        var v = node.getAttribute(a);
        var out = applyToString(v);
        if (out !== null && out !== v) {
          WALKER_BUSY = true;
          node.setAttribute(a, out);
          WALKER_BUSY = false;
        }
      }
    });
    var c = node.childNodes;
    for (var i = 0; i < c.length; i++) walk(c[i]);
  }

  function ensureObserver() {
    if (ACTIVE_OBSERVER || typeof MutationObserver === "undefined") return;
    ACTIVE_OBSERVER = new MutationObserver(function (muts) {
      if (WALKER_BUSY) return; // ignore mutations caused by our own rewrites
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === "characterData") {
          var n = m.target;
          if (n && n.nodeType === 3) {
            var t = n.nodeValue;
            if (!t || !t.trim()) continue;
            var out = applyToString(t);
            if (out !== null && out !== t) {
              WALKER_BUSY = true;
              n.nodeValue = out;
              WALKER_BUSY = false;
            }
          }
        } else if (m.type === "childList") {
          for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
        } else if (m.type === "attributes") {
          var el = m.target;
          if (!el || el.nodeType !== 1 || isSkipped(el)) continue;
          var attr = m.attributeName;
          if (!attr) continue;
          var v = el.getAttribute(attr);
          if (!v) continue;
          var out2 = applyToString(v);
          if (out2 !== null && out2 !== v) {
            WALKER_BUSY = true;
            el.setAttribute(attr, out2);
            WALKER_BUSY = false;
          }
        }
      }
    });
    ACTIVE_OBSERVER.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["alt", "aria-label", "title", "placeholder"],
    });
  }

  function applyDict(dict) {
    if (!dict) return;
    var normKeys = [];
    var normMap = {};
    var keys = Object.keys(dict);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var n = normQuotes(k);
      normKeys.push(n);
      normMap[n] = { original: k, value: dict[k] };
    }
    normKeys.sort(function (a, b) { return b.length - a.length; });
    ACTIVE_NORM_KEYS = normKeys;
    ACTIVE_NORM_MAP = normMap;
    walk(document.body);

    // Also translate <title> and key <meta> tags (head content the body walker misses).
    var titleEl = document.querySelector("title");
    if (titleEl) {
      var out = applyToString(titleEl.textContent);
      if (out !== null) titleEl.textContent = out;
    }
    ["description", "twitter:description", "twitter:title"].forEach(function (n) {
      var sel = n.indexOf(":") === -1
        ? 'meta[name="' + n + '"]'
        : 'meta[name="' + n + '"], meta[property="' + n + '"]';
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) {
        var v = els[i].getAttribute("content");
        if (!v) continue;
        var t = applyToString(v);
        if (t !== null) els[i].setAttribute("content", t);
      }
    });
    ["og:title", "og:description"].forEach(function (p) {
      var els = document.querySelectorAll('meta[property="' + p + '"]');
      for (var i = 0; i < els.length; i++) {
        var v = els[i].getAttribute("content");
        if (!v) continue;
        var t = applyToString(v);
        if (t !== null) els[i].setAttribute("content", t);
      }
    });
    // Install MutationObserver so dynamically-inserted DOM (Webflow carousels,
    // lazy-loaded sections, post-load animations) gets translated as it appears.
    ensureObserver();
  }

  function applyLanguage(code, opts) {
    var lang = langByCode(code);
    if (!lang) return;
    if (code !== "en" && !DICTS[code]) {
      // Should never happen because UI disables Coming-soon rows, but guard anyway.
      console.warn("[rp-lang-picker] no dictionary for", code);
      return;
    }
    if (code !== "en") applyDict(DICTS[code]);
    document.documentElement.setAttribute("lang", code);
    if (lang.dir === "rtl") document.documentElement.setAttribute("dir", "rtl");
    else document.documentElement.removeAttribute("dir");
    localStorage.setItem(STORE_KEY, code);
    updateFabFlag(code);
    // Localise the disclaimer line (modal is excluded from the page-level walker).
    var disclaimerEl = document.getElementById("rp-lang-disclaimer");
    if (disclaimerEl) {
      var translated = (DICTS[code] && DICTS[code][DISCLAIMER_KEY]) || DISCLAIMER_KEY;
      disclaimerEl.textContent = translated;
      disclaimerEl.setAttribute("dir", lang.dir === "rtl" ? "rtl" : "ltr");
    }
    // Update aria-current on rows
    var rows = document.querySelectorAll(".rp-lang-row");
    for (var i = 0; i < rows.length; i++) {
      rows[i].setAttribute("aria-current", rows[i].getAttribute("data-rp-lang") === code ? "true" : "false");
    }
    if (opts && opts.reload && code === "en") {
      // Reverting from another language requires a reload (we mutated text in place).
      location.reload();
    }
  }

  // ---------- Wiring ----------
  function wire() {
    var els = build();
    var typedNode = els.modal.querySelector("[data-rp-lang-typed]");
    startTitleCycler(typedNode);

    // First-visit auto-interrupt handles. Tracked so any engagement (manual open
    // via FAB, row pick, scroll trigger firing once) cancels the still-pending
    // siblings — without this, picking a language before the 10s mark left the
    // setTimeout alive and the modal popped back open mid-browsing.
    var autoOpenTimer = null;
    var autoOpenScrollHandler = null;
    function cancelAutoOpen() {
      if (autoOpenTimer) { clearTimeout(autoOpenTimer); autoOpenTimer = null; }
      if (autoOpenScrollHandler) {
        window.removeEventListener("scroll", autoOpenScrollHandler);
        autoOpenScrollHandler = null;
      }
    }

    function open() {
      cancelAutoOpen();
      els.back.classList.add("rp-show");
      els.modal.classList.add("rp-show");
      els.modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function close() {
      els.back.classList.remove("rp-show");
      els.modal.classList.remove("rp-show");
      els.modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      // Persist dismissal so we don't re-prompt next visit. If user explicitly
      // picks a row later, that handler will overwrite this.
      try {
        if (!localStorage.getItem(STORE_KEY)) localStorage.setItem(STORE_KEY, "en");
      } catch (_) {}
    }

    els.back.addEventListener("click", close);
    els.fab.addEventListener("click", open);
    var closeBtn = els.modal.querySelector("[data-rp-lang-close]");
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && els.modal.classList.contains("rp-show")) close();
    });

    // Row clicks
    els.list.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(".rp-lang-row");
      if (!btn) return;
      if (btn.getAttribute("aria-disabled") === "true") return;
      var code = btn.getAttribute("data-rp-lang");
      var prev = localStorage.getItem(STORE_KEY) || "en";
      if (code === prev) { close(); return; }
      // If switching from non-English back to English, full reload (no in-place revert).
      if (code === "en" && prev !== "en") {
        localStorage.setItem(STORE_KEY, "en");
        close();
        location.reload();
        return;
      }
      // Close first so the modal-out animation gets a paint frame BEFORE we
      // block the main thread on the DOM walk. Otherwise the modal "freezes"
      // for the duration of applyDict and the user thinks the click missed.
      close();
      requestAnimationFrame(function () { applyLanguage(code); });
    });

    // Auto-apply previously chosen language on load.
    // We never auto-OPEN the modal — the floating FAB stays accessible and
    // users open the picker manually. Auto-open caused first-time visitors to
    // hit a full-screen interrupt that blocked every CTA on the page.
    var stored = localStorage.getItem(STORE_KEY);
    if (stored && stored !== "en") {
      applyLanguage(stored);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
