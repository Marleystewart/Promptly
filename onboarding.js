// First-run welcome, the interactive product tour, and the Help menu.
//
// Kept in one file on purpose. Promptly is a plain-script app — no bundler, no
// framework — so a folder of modules would need either a build step this repo
// does not have or a dozen more <script> tags, each with its own cache-bust to
// keep in sync. The sections below are the components: TOUR STEPS, SPOTLIGHT,
// CARD, ENGINE, WELCOME, HELP.
//
// Deliberately no getting-started checklist: every item on it was something a
// student has to do anyway to use Promptly at all, so it was a second copy of
// the product's own navigation asking to be ticked off.
//
// Everything here is additive. It reads the app through data-tour attributes
// and public DOM, never reaches into script.js internals, and if any target is
// missing the step is skipped rather than trapping the student behind an
// overlay.
(function () {
  "use strict";

  // ── State ───────────────────────────────────────────────────────────────
  // localStorage only. Onboarding progress is a per-device convenience, not
  // something worth storing against the account, and every read is wrapped
  // because private windows throw on access rather than returning null.
  var KEY_DONE = "promptly_onboarding_completed";
  var KEY_SKIPPED = "promptly_onboarding_skipped";
  var KEY_MODE = "promptly_onboarding_mode";   // "new" | "existing"
  var KEY_HINT = "promptly_walkthrough_hint_dismissed";

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private window */ }
  }

  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
  }
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Read the student's own profile if the app has one, so a step can say
  // "your Finance filters" instead of a generic line. Never guessed: if the
  // field is empty the copy falls back to wording that reads correctly with
  // nothing filled in.
  function profileHint() {
    var fields = [];
    try {
      document.querySelectorAll("[data-field-chip].active, .field-chip.active").forEach(function (el) {
        var t = (el.textContent || "").trim();
        if (t && t.toLowerCase() !== "all") fields.push(t);
      });
    } catch (e) { /* ignore */ }
    return fields.slice(0, 2).join(" and ");
  }

  // ── TOUR STEPS ──────────────────────────────────────────────────────────
  // Every claim below was checked against what the app actually does.
  // Deliberately absent: anything about matching, scoring or instant delivery.
  // Promptly runs no model, and alerts are a daily digest plus push, so the
  // copy says exactly that.
  function steps() {
    var hint = profileHint();
    return [
      {
        id: "feed",
        view: "openings",
        target: '[data-tour="opportunity-feed"]',
        title: "Every opening in one place",
        body: "Promptly reads employers' own hiring systems, so a role shows here while it is genuinely open on their board — not scraped from a job aggregator.",
        placement: "bottom",
      },
      {
        id: "search",
        view: "openings",
        // The input itself, not the whole panel — the panel also holds the
        // filter rows, and lighting both makes the next step redundant.
        target: '[data-tour="search"] label',
        title: "Go straight to a company",
        body: "Search by company or role when you already know what you are looking for.",
        placement: "bottom",
      },
      {
        id: "filters",
        view: "openings",
        target: '[data-tour="filters"]',
        title: "Cut the feed down to you",
        body: hint
          ? "Filter by field to focus the feed. Yours is set to " + hint + " right now, and you can change it any time."
          : "Filter by field so the feed shows the kind of work you actually want.",
        placement: "bottom",
      },
      {
        id: "card",
        view: "openings",
        // A class selector, not a positional one: the feed re-renders constantly,
        // so nth-child would break the moment a listing arrives.
        target: '#view-openings .opening-row',
        title: "Enough to decide in a glance",
        body: "Each card carries the employer, role, location and when it was posted. Open it for the details, or go straight to the employer's own posting to apply.",
        placement: "right",
        mobilePlacement: "top",
      },
      {
        id: "cycles",
        view: "cycles",
        target: '[data-tour="recruiting-cycles"]',
        // The desktop calendar is hidden below 1024px — CSS shows the phone
        // month view instead. Without a mobile target this step silently
        // vanished on a phone, which is where most students are.
        mobileTarget: '[data-tour="recruiting-cycles-mobile"]',
        title: "See when hiring actually happens",
        body: "Months that have passed show when employers really posted. Future months show estimated windows based on previous years — useful for planning, never a promise.",
        placement: "top",
      },
      {
        id: "watch",
        view: "alerts",
        target: '[data-tour="follow-company"]',
        title: "Track a company we don't cover yet",
        body: "Paste any company's careers link. If it runs on a hiring platform Promptly can read, it joins your alerts like everything else.",
        placement: "bottom",
      },
      {
        id: "preferences",
        view: "profile",
        // The first preferences card, not the entire tab panel, which is
        // taller than the viewport and would light up the whole screen.
        target: '[data-tour="preferences"] .settings-card',
        title: "Keep it pointed at what you want",
        body: "Your school, class year and fields shape which openings count as yours. Change them whenever your search changes.",
        placement: "bottom",
      },
      {
        id: "alerts",
        view: "profile",
        // Notification settings live behind the Settings tab, so the step opens
        // it first. `prep` is a click, not a state mutation — it leaves the
        // student exactly where any tab click would.
        prep: '.profile-tab[data-profile-tab="settings"]',
        target: '[data-tour="notifications"]',
        title: "How Promptly reaches you",
        body: "Email alerts and a daily digest are on by default. Turn on push notifications to get openings on your device as well.",
        placement: "top",
      },
      {
        id: "help",
        view: null,
        target: '[data-tour="help"]',
        title: "This is always here",
        body: "Reopen this walkthrough any time from Help.",
        placement: "bottom",
      },
    ];
  }

  // ── SPOTLIGHT + CARD ────────────────────────────────────────────────────
  var el = {};       // overlay pieces, built once
  var order = [];    // steps for this run
  var index = 0;
  var lastFocus = null;
  var reposition = null;

  function build() {
    if (el.root) return;

    el.root = document.createElement("div");
    el.root.className = "tour-root";
    el.root.hidden = true;

    // ONE element, not four panels.
    //
    // The first version shaded around the target with four rectangles. Each
    // animated independently, so every transition looked like the screen
    // breaking apart and reassembling — seams visibly sliding past each other.
    //
    // A single element with a very large spread shadow paints the entire scrim
    // AND the cutout together, so moving the spotlight is one element changing
    // size and position: no seams, and nothing to fall out of sync.
    el.ring = document.createElement("div");
    el.ring.className = "tour-ring";
    el.root.appendChild(el.ring);

    el.card = document.createElement("div");
    el.card.className = "tour-card";
    el.card.setAttribute("role", "dialog");
    el.card.setAttribute("aria-modal", "true");
    el.card.setAttribute("aria-labelledby", "tour-card-title");
    el.card.innerHTML =
      '<p class="tour-step-count" data-tour-count></p>' +
      '<h2 id="tour-card-title" data-tour-title></h2>' +
      '<p class="tour-body" data-tour-body></p>' +
      '<div class="tour-progress" aria-hidden="true"><span data-tour-bar></span></div>' +
      '<div class="tour-actions">' +
      '<button type="button" class="tour-skip" data-tour-skip>Skip tour</button>' +
      '<div class="tour-move">' +
      '<button type="button" class="tour-back" data-tour-back>Back</button>' +
      '<button type="button" class="tour-next" data-tour-next>Next</button>' +
      "</div></div>";
    el.root.appendChild(el.card);
    document.body.appendChild(el.root);

    el.card.querySelector("[data-tour-skip]").addEventListener("click", function () { end("skipped"); });
    el.card.querySelector("[data-tour-back]").addEventListener("click", function () { go(index - 1); });
    el.card.querySelector("[data-tour-next]").addEventListener("click", function () { go(index + 1); });
  }

  // Place the four shades around the target rect, and the ring on it.
  // Deliberately NO cap on how much of the screen a spotlight may cover.
  //
  // An earlier version clamped it to 62% of the viewport so the card always had
  // un-shaded space to sit in. That chopped the recruiting calendar in half and
  // cut the feed short — the student saw a highlight that stopped partway
  // through the thing being explained, which reads as a rendering bug.
  //
  // Highlighting the whole target is the point. Where that leaves no room
  // beside it, placeCard() floats the card over a corner instead; the card is
  // small and the target is larger than the screen, so nothing is lost.

  function paint(rect) {
    var pad = 8;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var t = Math.max(0, rect.top - pad);
    var l = Math.max(0, rect.left - pad);
    var r = Math.min(w, rect.right + pad);
    var b = Math.min(h, rect.bottom + pad);

    Object.assign(el.ring.style, {
      top: t + "px",
      left: l + "px",
      width: Math.max(0, r - l) + "px",
      height: Math.max(0, b - t) + "px",
    });
  }

  // Choose a side with room for the card, then clamp it inside the viewport.
  // On a phone the card is a bottom sheet unless the target is itself low on
  // screen, in which case it goes to the top so it never covers what it is
  // describing.
  function placeCard(rect, step) {
    var card = el.card;
    card.classList.remove("tour-card-sheet");
    card.classList.remove("tour-card-floating");
    card.style.top = ""; card.style.left = ""; card.style.right = ""; card.style.bottom = "";

    var vh = window.innerHeight;
    var vw = window.innerWidth;

    if (isMobile()) {
      card.classList.add("tour-card-sheet");
      var targetLow = rect.top > vh * 0.55;
      if (targetLow) {
        card.style.top = "12px";
      } else {
        // Clear the bottom tab bar. The sheet used to sit flush to the bottom
        // edge, which covered the very nav the tour highlights — so on a phone
        // the student could not see which tab they had been moved to.
        var bar = document.querySelector(".mobile-nav");
        var barHeight = bar && bar.getBoundingClientRect().height > 0
          ? Math.round(bar.getBoundingClientRect().height) + 10
          : 12;
        card.style.bottom = "calc(" + barHeight + "px + env(safe-area-inset-bottom, 0px))";
      }
      return;
    }

    var size = card.getBoundingClientRect();
    var gap = 16;
    var want = step.placement || "bottom";
    var below = vh - rect.bottom;
    var above = rect.top;
    var right = vw - rect.right;
    var left = rect.left;

    var fitsBelow = below >= size.height + gap;
    var fitsAbove = above >= size.height + gap;
    var fitsRight = right >= size.width + gap;
    var fitsLeft = left >= size.width + gap;

    // Nothing fits — the target is as big as the screen. Float the card in the
    // lower-right, raised off the surface. Better than shrinking the spotlight
    // and cutting the target in half, which is what the previous version did.
    if (!fitsBelow && !fitsAbove && !fitsRight && !fitsLeft) {
      card.classList.add("tour-card-floating");
      card.style.right = "20px";
      card.style.bottom = "20px";
      return;
    }
    card.classList.remove("tour-card-floating");

    if (want === "right" && !fitsRight) want = fitsBelow ? "bottom" : (fitsAbove ? "top" : "left");
    if (want === "bottom" && !fitsBelow) want = fitsAbove ? "top" : (fitsRight ? "right" : "left");
    if (want === "top" && !fitsAbove) want = fitsBelow ? "bottom" : (fitsRight ? "right" : "left");
    if (want === "left" && !fitsLeft) want = fitsRight ? "right" : (fitsBelow ? "bottom" : "top");

    var top;
    var x;
    if (want === "right") { x = rect.right + gap; top = rect.top; }
    else if (want === "left") { x = rect.left - size.width - gap; top = rect.top; }
    else if (want === "top") { x = rect.left; top = rect.top - size.height - gap; }
    else { x = rect.left; top = rect.bottom + gap; }

    card.style.left = Math.round(Math.min(Math.max(12, x), vw - size.width - 12)) + "px";
    card.style.top = Math.round(Math.min(Math.max(12, top), vh - size.height - 12)) + "px";
  }

  // ── ENGINE ──────────────────────────────────────────────────────────────
  function switchView(view) {
    if (!view) return;
    var active = document.querySelector(".view.active");
    if (active && active.id === "view-" + view) return;

    // Click a VISIBLE nav item.
    //
    // Promptly ships two navigations — a desktop sidebar and a phone bottom
    // bar — and both are in the DOM at every width, with CSS hiding one. A
    // plain querySelector returns whichever comes first in the markup, which
    // on a phone is the hidden desktop one. Clicking that did nothing, so on
    // mobile every step found no target and the whole tour skipped straight to
    // the finish screen.
    var items = document.querySelectorAll('.nav-item[data-view="' + view + '"]');
    for (var i = 0; i < items.length; i += 1) {
      var box = items[i].getBoundingClientRect();
      if (box.width > 0 && box.height > 0) { items[i].click(); return; }
    }
    if (items[0]) items[0].click();
  }

  // Wait briefly for a target to exist. The feed renders asynchronously, so a
  // step can arrive before its card does; polling beats a fixed timeout that is
  // either too short on a slow connection or wasted time on a fast one.
  function waitFor(selector, tries) {
    return new Promise(function (resolve) {
      var left = tries == null ? 24 : tries;
      (function look() {
        var node = document.querySelector(selector);
        if (node && node.getBoundingClientRect().width > 0) return resolve(node);
        if (left-- <= 0) return resolve(null);
        setTimeout(look, 60);
      })();
    });
  }

  function go(next) {
    if (next < 0) return;
    if (next >= order.length) return end("completed");
    index = next;
    render();
  }

  // Wait until the target has stopped moving.
  //
  // smooth scrolling is asynchronous with no completion event, so the old code
  // guessed by redrawing at two animation frames and again at 260ms. Those
  // three draws were three visible jumps: the ring landed, the page kept
  // scrolling under it, and it snapped again. Polling the rect until it stops
  // changing means the spotlight is placed once, on a settled page.
  function whenStill(node, done) {
    var last = null;
    var stable = 0;
    var tries = 0;
    (function tick() {
      var r = node.getBoundingClientRect();
      // SIZE as well as position. Watching only top/left settled the moment the
      // page stopped scrolling, which on the recruiting calendar was before its
      // rows had rendered — the spotlight measured a half-built element and lit
      // the toolbar instead of the calendar.
      var same = last
        && Math.abs(r.top - last.top) < 0.5
        && Math.abs(r.left - last.left) < 0.5
        && Math.abs(r.height - last.height) < 0.5
        && Math.abs(r.width - last.width) < 0.5;
      stable = same ? stable + 1 : 0;
      last = r;
      // Three consecutive identical frames, not two: a element that grows in
      // steps can pause for one frame between them.
      if (stable >= 3 || tries++ > 60) return done(node.getBoundingClientRect());
      requestAnimationFrame(tick);
    })();
  }

  function render() {
    var step = order[index];
    var first = el.root.hidden;

    // Hide the card while the page moves. Watching it slide across a scrolling
    // screen is most of what made this feel unsteady.
    el.card.classList.add("tour-card-moving");

    switchView(step.view);

    if (step.prep) {
      var prep = document.querySelector(step.prep);
      if (prep) prep.click();
    }

    var selector = (isMobile() && step.mobileTarget) ? step.mobileTarget : step.target;

    waitFor(selector).then(function (node) {
      // A missing target must never strand the student. Skip forward, or if
      // this was the last step, finish cleanly.
      if (!node) {
        if (index + 1 < order.length) return go(index + 1);
        return end("completed");
      }

      // A target that fits gets centred. One that does not gets aligned to its
      // top, so the student sees the beginning of it rather than its middle.
      var overflows = node.getBoundingClientRect().height > window.innerHeight - 24;
      node.scrollIntoView({
        block: overflows ? "start" : "center",
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });

      // Cam's note: keep everything else dimmed, but let the student SEE which
      // tab the tour has moved to. Without this the sidebar greys out and the
      // walkthrough appears to teleport between unrelated screens.
      markActiveNav();

      el.card.querySelector("[data-tour-count]").textContent = "Step " + (index + 1) + " of " + order.length;
      el.card.querySelector("[data-tour-title]").textContent = step.title;
      el.card.querySelector("[data-tour-body]").textContent = step.body;
      el.card.querySelector("[data-tour-bar]").style.width = Math.round(((index + 1) / order.length) * 100) + "%";
      el.card.querySelector("[data-tour-back]").disabled = index === 0;
      el.card.querySelector("[data-tour-next]").textContent = index === order.length - 1 ? "Finish" : "Next";

      whenStill(node, function (rect) {
        // On the very first step the ring has no previous position, so it would
        // animate in from the top-left corner. Place it without a transition,
        // then let every later move animate.
        if (first) {
          el.ring.classList.add("tour-no-anim");
          paint(rect);
          el.root.hidden = false;
          document.body.classList.add("tour-open");
          requestAnimationFrame(function () { el.ring.classList.remove("tour-no-anim"); });
        } else {
          paint(rect);
        }

        placeCard(rect, step);
        // Let the spotlight travel first, then bring the card back. Moving both
        // at once is what read as messy.
        setTimeout(function () {
          el.card.classList.remove("tour-card-moving");
          el.card.querySelector("[data-tour-next]").focus({ preventScroll: true });
        }, prefersReducedMotion() ? 0 : 200);
      });

      // Only resize needs re-measuring: the body is locked while the tour is
      // open, so nothing else moves the target underneath us.
      if (reposition) window.removeEventListener("resize", reposition);
      reposition = function () {
        var r = node.getBoundingClientRect();
        paint(r);
        placeCard(r, step);
      };
      window.addEventListener("resize", reposition, { passive: true });
    });
  }

  // Lift the current nav item above the scrim so it reads at full strength.
  // Applied to every nav (desktop sidebar and phone bar), because which one is
  // visible depends on the width.
  function markActiveNav() {
    document.querySelectorAll(".nav-item.tour-nav-current").forEach(function (n) {
      n.classList.remove("tour-nav-current");
    });
    document.querySelectorAll(".nav-item.active").forEach(function (n) {
      n.classList.add("tour-nav-current");
    });
  }

  function clearActiveNav() {
    document.querySelectorAll(".nav-item.tour-nav-current").forEach(function (n) {
      n.classList.remove("tour-nav-current");
    });
  }

  function onKey(event) {
    if (el.root.hidden) return;
    if (event.key === "Escape") { event.preventDefault(); end("skipped"); }
    else if (event.key === "ArrowRight") go(index + 1);
    else if (event.key === "ArrowLeft") go(index - 1);
  }

  var welcomeTimer = null;
  var running = false;

  function start(from) {
    // Cancel a pending welcome. Without this, a tour started from Help (or by
    // the dev API) within the first second of load ends up sharing the screen
    // with the welcome modal — two dialogs, both claiming focus.
    if (welcomeTimer) { clearTimeout(welcomeTimer); welcomeTimer = null; }
    document.querySelectorAll(".tour-modal-back").forEach(function (n) { n.remove(); });
    running = true;
    build();
    order = steps();
    index = 0;
    lastFocus = document.activeElement;
    document.addEventListener("keydown", onKey);
    if (from === "help") { /* nothing extra — kept for future analytics */ }
    render();
  }

  function end(reason) {
    running = false;
    if (el.root) {
      el.root.hidden = true;
      // Clear inline placement so a later run cannot inherit a stale position.
      el.card.style.cssText = "";
    }
    document.body.classList.remove("tour-open");
    clearActiveNav();
    document.removeEventListener("keydown", onKey);
    if (reposition) {
      window.removeEventListener("resize", reposition);
      reposition = null;
    }
    if (reason === "completed") write(KEY_DONE, "1");
    if (reason === "skipped") write(KEY_SKIPPED, "1");
    if (reason === "completed") showFinish();
    else restoreFocus();
  }

  function restoreFocus() {
    try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch (e) { /* gone */ }
  }

  // ── WELCOME + FINISH ────────────────────────────────────────────────────
  function modal(html) {
    var back = document.createElement("div");
    back.className = "tour-modal-back";
    back.innerHTML = '<div class="tour-modal" role="dialog" aria-modal="true" aria-labelledby="tour-modal-title">' + html + "</div>";
    document.body.appendChild(back);
    document.body.classList.add("tour-open");

    var box = back.querySelector(".tour-modal");
    var focusables = box.querySelectorAll("button");
    if (focusables[0]) focusables[0].focus();

    // Focus trap. Without it, Tab walks out of the dialog and into an app the
    // student cannot see.
    function trap(event) {
      if (event.key !== "Tab") return;
      var list = box.querySelectorAll("button");
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    box.addEventListener("keydown", trap);

    return {
      node: back,
      close: function () {
        back.remove();
        document.body.classList.remove("tour-open");
      },
    };
  }

  function showWelcome() {
    if (running) return;
    var m = modal(
      '<p class="tour-eyebrow">Welcome to Promptly</p>' +
      '<h2 id="tour-modal-title">Spend less time searching. Spend more time applying.</h2>' +
      '<p>Promptly watches employers’ own hiring systems so you do not have to check them one by one. Take a minute and we will show you around.</p>' +
      '<div class="tour-modal-actions">' +
      '<button type="button" class="primary-action" data-welcome-start>Show me around</button>' +
      '<button type="button" class="soft-action" data-welcome-skip>I’ll explore myself</button>' +
      "</div>"
    );
    m.node.querySelector("[data-welcome-start]").addEventListener("click", function () {
      m.close();
      start("welcome");
    });
    m.node.querySelector("[data-welcome-skip]").addEventListener("click", function () {
      write(KEY_SKIPPED, "1");
      m.close();
      });
  }

  function showFinish() {
    var m = modal(
      '<p class="tour-eyebrow">You’re set</p>' +
      '<h2 id="tour-modal-title">Now let Promptly do the checking.</h2>' +
      '<p>Openings appear as employers post them. Come back any time, or let your alerts bring them to you.</p>' +
      '<div class="tour-modal-actions">' +
      '<button type="button" class="primary-action" data-finish-explore>Explore openings</button>' +
      '<button type="button" class="soft-action" data-finish-restart>Restart tour</button>' +
      "</div>"
    );
    m.node.querySelector("[data-finish-explore]").addEventListener("click", function () {
      m.close();
      switchView("openings");
      restoreFocus();
    });
    m.node.querySelector("[data-finish-restart]").addEventListener("click", function () {
      m.close();
      start("restart");
    });
  }

  // ── INSTALL GUIDE (iPhone) ──────────────────────────────────────────────
  // Teaching students that Promptly can live on the Home Screen.
  //
  // This is not a nicety, and it is iPhone-only for a reason. Safari gives Web
  // Push to an installed Home Screen app and to nothing else, so an iPhone
  // student who never installs Promptly cannot be notified at all — and
  // notifications are the product. Twenty accounts have enabled push zero
  // times. Android has no such limit (Chrome delivers push from an ordinary
  // tab), so an Android student loses nothing by never seeing this, and a
  // modal they do not need is just friction.
  //
  // It runs at the SIGN-IN screen, before the student is inside Promptly. On
  // iOS a session created in Safari does not carry into the Home Screen app —
  // see homeScreenHandoffNote() in script.js — so anyone who signs in first
  // and installs afterwards opens their new icon and finds themselves signed
  // out. Installing first means signing in once, inside the installed app.

  var KEY_INSTALL = "promptly_install_guide_dismissed";

  // Two keys, both honoured. At dismissal time there is usually no account to
  // attach this to — only the device — but once someone signs in the answer
  // should follow them. So dismissal writes both, and either one counts.
  // Without that, dismissing at the login screen then signing in would show
  // the same modal a second time.
  function installKeys() {
    var keys = [KEY_INSTALL];
    var email = "";
    try {
      var stored = JSON.parse(localStorage.getItem("openingProfile") || "{}");
      email = String(stored.email || "").trim().toLowerCase();
    } catch (e) { /* unreadable profile */ }
    if (email) keys.push(KEY_INSTALL + ":" + email);
    return keys;
  }

  function installDismissed() {
    return installKeys().some(function (k) { return read(k) === "1"; });
  }

  function rememberInstallDismissed() {
    installKeys().forEach(function (k) { write(k, "1"); });
  }

  function installedToHomeScreen() {
    return window.navigator.standalone === true
      || (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches);
  }

  // iPadOS reports itself as a Mac and is excluded anyway: this is written for
  // a phone.
  function isIPhone() {
    return /iPhone|iPod/i.test(navigator.userAgent || "");
  }

  // In-app browsers are the reason step 1 exists. Instagram, Facebook,
  // LinkedIn, TikTok and Gmail open links in a webview with no Add to Home
  // Screen entry, so a student following a link from a post literally cannot
  // install Promptly from where they are standing.
  function inAppBrowser() {
    return /FBAN|FBAV|Instagram|LinkedIn|Twitter|TikTok|Snapchat|Pinterest|GSA\/|Line\/|MicroMessenger/i
      .test(navigator.userAgent || "");
  }

  // Deliberately conservative. A false "you are already in Safari" sends a
  // student hunting for a Share button that is not there, so anything
  // ambiguous falls through to showing the instruction normally.
  function definitelySafari() {
    var ua = navigator.userAgent || "";
    if (inAppBrowser()) return false;
    if (/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android/i.test(ua)) return false;
    return /Safari/i.test(ua) && /Version\//i.test(ua);
  }

  function igStep(number, title, body, extra) {
    return '<li class="ig-step">' +
      '<span class="ig-num" aria-hidden="true">' + number + "</span>" +
      '<div class="ig-step-body"><h3>' + title + "</h3><p>" + body + "</p>" + (extra || "") +
      "</div></li>";
  }

  // A three-beat diagram rather than a fake iOS screenshot: recognisable
  // enough to follow, honest about not being a real screen capture.
  function igSequence() {
    return '<div class="ig-seq" role="img" aria-label="Tap Share, then Add to Home Screen, then tap Add">' +
      '<span class="ig-seq-step"><span class="ig-seq-icon">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7"/></svg>' +
      "</span>Share</span>" +
      '<span class="ig-seq-arrow" aria-hidden="true">&rarr;</span>' +
      '<span class="ig-seq-step"><span class="ig-seq-icon">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 9v6"/><path d="M9 12h6"/></svg>' +
      "</span>Add to Home Screen</span>" +
      '<span class="ig-seq-arrow" aria-hidden="true">&rarr;</span>' +
      '<span class="ig-seq-step"><span class="ig-seq-icon ig-seq-brand">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>' +
      "</span>Tap Add</span></div>";
  }

  function showInstallGuide() {
    if (document.querySelector(".ig-back")) return;

    var safariDone = definitelySafari();

    var body =
      '<div class="ig-card" role="dialog" aria-modal="true" aria-labelledby="ig-title">' +
        '<button type="button" class="ig-close" data-ig-close aria-label="Close">&times;</button>' +
        '<div class="ig-scroll">' +
          '<span class="ig-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg></span>' +
          '<h2 id="ig-title">Get the full Promptly experience</h2>' +
          '<p class="ig-lede">Add Promptly to your Home Screen and turn on notifications so you never miss a new opening.</p>' +
          '<ol class="ig-steps' + (safariDone ? " ig-steps-one-done" : "") + '">' +
            igStep(1,
              safariDone ? "You&rsquo;re already in Safari" : "Open Promptly in Safari",
              safariDone
                ? "Nothing to do here &mdash; carry on to step&nbsp;2."
                : "If you opened Promptly from Instagram, LinkedIn, Gmail or another app, open this page in Safari first.") +
            igStep(2, "Add Promptly to your Home Screen",
              "In Safari, tap the Share button, scroll down, then tap <strong>Add to Home Screen</strong>.",
              igSequence()) +
            igStep(3, "Turn on notifications",
              "Open Promptly from your new Home Screen icon and switch alerts on. On iPhone that is the only way notifications can reach you.") +
          "</ol>" +
        "</div>" +
        '<div class="ig-actions">' +
          '<button type="button" class="ig-primary" data-ig-done>Got it</button>' +
          '<button type="button" class="ig-later" data-ig-later>Maybe later</button>' +
        "</div>" +
      "</div>";

    var back = document.createElement("div");
    back.className = "ig-back";
    back.innerHTML = body;
    document.body.appendChild(back);
    document.body.classList.add("tour-open");
    requestAnimationFrame(function () { back.classList.add("ig-in"); });

    var card = back.querySelector(".ig-card");
    var opener = document.activeElement;

    function close() {
      rememberInstallDismissed();
      back.classList.remove("ig-in");
      var finish = function () {
        back.remove();
        document.body.classList.remove("tour-open");
        try { if (opener && opener.focus) opener.focus(); } catch (e) { /* gone */ }
      };
      if (prefersReducedMotion()) finish(); else setTimeout(finish, 180);
    }

    back.querySelector("[data-ig-close]").addEventListener("click", close);
    back.querySelector("[data-ig-done]").addEventListener("click", close);
    back.querySelector("[data-ig-later]").addEventListener("click", close);

    // Deliberately no Notification.requestPermission() anywhere in here. A
    // permission prompt the student did not ask for gets denied, and on iOS a
    // denial is effectively permanent — it would cost us the very thing this
    // modal exists to win.

    card.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab") return;
      var list = card.querySelectorAll("button");
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    back.querySelector("[data-ig-done]").focus();
  }

  function maybeShowInstallGuide() {
    if (!isIPhone()) return false;             // see isIPhone()
    if (installedToHomeScreen()) return false; // already done what this asks
    if (installDismissed()) return false;
    // New people only.
    //
    // Without this, a student who has used Promptly on this phone for weeks
    // would meet the modal the first time it ships — an install prompt for an
    // app they clearly already know how to reach. accountMode() answers the
    // question once, on this file's first ever run, by whether a profile
    // already existed: a brand-new visitor arrives at the sign-in screen with
    // nothing stored, an established one does not.
    if (accountMode() !== "new") return false;
    showInstallGuide();
    return true;
  }

  // ── HELP ────────────────────────────────────────────────────────────────
  function wireHelp() {
    var button = document.querySelector("[data-tour='help']");
    var menu = document.querySelector("[data-help-menu]");
    if (!button || !menu) return;

    function close() {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (event) {
      if (!menu.hidden && !menu.contains(event.target) && event.target !== button) close();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !menu.hidden) { close(); button.focus(); }
    });
    var take = menu.querySelector("[data-help-tour]");
    if (take) take.addEventListener("click", function () { close(); start("help"); });
    menu.querySelectorAll("[data-help-go]").forEach(function (b) {
      b.addEventListener("click", function () { close(); switchView(b.getAttribute("data-help-go")); });
    });
  }

  // ── Boot ────────────────────────────────────────────────────────────────
  // Is the student actually inside the app?
  //
  // Promptly opens on its own account/profile setup, and .app-shell is in the
  // DOM the whole time — hidden behind that flow. The welcome modal was firing
  // 700ms after load regardless, so a brand-new student met a product tour
  // stacked on top of the signup form they had not filled in yet.
  function inTheApp() {
    var shell = document.querySelector(".app-shell");
    if (!shell) return false;
    var box = shell.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  }

  // Poll briefly rather than firing once: the student may take a minute over
  // the signup form, and the welcome should meet them on the other side of it
  // rather than never appearing at all.
  function whenInTheApp(done) {
    var tries = 0;
    (function look() {
      if (inTheApp()) return done();
      if (tries++ > 600) return; // ~5 minutes, then give up quietly
      setTimeout(look, 500);
    })();
  }

  // Brand new, or already using Promptly?
  //
  // Decided once, on this file's first ever run on the device, and then
  // remembered — so it cannot flip later when the profile is created.
  //
  // The test is simply whether a profile already existed at that moment. A
  // brand-new student arrives at the signup flow with nothing stored; someone
  // who set Promptly up weeks ago already has a profile. Interrupting that
  // second person with a full-screen welcome for an app they already use is
  // exactly the kind of thing people close without reading.
  function accountMode() {
    var stored = read(KEY_MODE);
    if (stored) return stored;
    var hadProfile = false;
    try { hadProfile = Boolean(localStorage.getItem("openingProfile")); } catch (e) { /* private window */ }
    var mode = hadProfile ? "existing" : "new";
    write(KEY_MODE, mode);
    return mode;
  }

  // The quiet version, for someone who already has an account: a small pill
  // beside Help rather than a modal over the app.
  function showHint() {
    if (read(KEY_HINT) === "1" || read(KEY_DONE) === "1") return;
    var host = document.querySelector(".help-wrap");
    if (!host || host.querySelector(".tour-hint")) return;

    var hint = document.createElement("div");
    hint.className = "tour-hint";
    hint.innerHTML =
      // Two labels rather than a CSS font-size trick: the phone header has room
      // for four icons and not much else, and a pill that wraps or pushes them
      // off the edge is worse than no pill.
      '<button type="button" class="tour-hint-open" data-hint-open>' +
        '<span class="tour-hint-long">Walkthrough available</span>' +
        '<span class="tour-hint-short">Tour</span>' +
      "</button>" +
      '<button type="button" class="tour-hint-close" data-hint-close aria-label="Dismiss walkthrough hint">&times;</button>';
    host.parentNode.insertBefore(hint, host);

    hint.querySelector("[data-hint-open]").addEventListener("click", function () {
      hint.remove();
      start("hint");
    });
    hint.querySelector("[data-hint-close]").addEventListener("click", function () {
      write(KEY_HINT, "1");
      hint.remove();
    });
  }

  function boot() {
    wireHelp();

    // Auto-run once, and only for someone who has neither finished nor
    // declined. A tour that reappears after you dismissed it is the thing
    // people uninstall apps over.
    // At the sign-in screen, before the student is inside Promptly.
    setTimeout(maybeShowInstallGuide, 600);

    // The walkthrough is about USING Promptly, so it waits until they are in it.
    if (read(KEY_DONE) !== "1" && read(KEY_SKIPPED) !== "1") {
      whenInTheApp(function () {
        if (document.querySelector(".ig-back")) return; // install guide still open
        if (accountMode() === "new") welcomeTimer = setTimeout(showWelcome, 700);
        else showHint();
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // Exposed for the Help menu, for tests, and for resetting during
  // development: promptlyTour.reset() then reload.
  window.promptlyTour = {
    start: function () { start("api"); },
    reset: function () {
      try {
        localStorage.removeItem(KEY_DONE);
        localStorage.removeItem(KEY_SKIPPED);
        localStorage.removeItem(KEY_MODE);
        localStorage.removeItem(KEY_HINT);
        installKeys().forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) { /* private window */ }
    },
    steps: steps,
    // Dev hooks. The install guide branches on user agent and on whether
    // Promptly is already installed, and neither changes when you resize a
    // window — so calling it directly is the only way to see it from a desktop.
    showInstallGuide: showInstallGuide,
    installGuideState: function () {
      return {
        iphone: isIPhone(),
        inAppBrowser: inAppBrowser(),
        safari: definitelySafari(),
        installed: installedToHomeScreen(),
        dismissed: installDismissed(),
        accountMode: accountMode(),
        keys: installKeys(),
      };
    },
  };
})();
