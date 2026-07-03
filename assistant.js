/* ============================================================================
   Ask Promptly — scripted helper (Option A)
   ----------------------------------------------------------------------------
   A guardrailed, 100%-controlled Q&A widget. It answers ONLY from:
     • the live `openings` array (real deadlines / real links / real counts)
     • a curated, hand-written interview tips library
     • a static FAQ about how Promptly works
   Anything off-script routes the student to a real support email.
   No AI, no network calls, no hallucination risk, works offline.
   Loaded AFTER script.js so it can read the global `openings` array.
============================================================================ */
(function () {
  "use strict";

  const SUPPORT_EMAIL = "help.promptly@gmail.com";

  // --- helpers ---------------------------------------------------------------
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  // Read the live openings array (mutated in place by loadLiveOpenings()).
  function liveOpenings() {
    try {
      return typeof openings !== "undefined" && Array.isArray(openings) ? openings : [];
    } catch (_) {
      return [];
    }
  }

  const isOpenNow = (o) =>
    !o.upcoming && !o.awaiting && !/awaiting|opens |applications open/i.test(o.deadline || o.opened || "");

  // Find an opening whose company the text mentions. Longest name first so
  // "Goldman Sachs" wins over a stray "Sachs".
  function matchCompany(text) {
    const list = liveOpenings();
    const names = [...new Set(list.map((o) => o.company).filter(Boolean))].sort(
      (a, b) => b.length - a.length
    );
    const low = text.toLowerCase();
    for (const name of names) {
      const first = name.split(/[\s.]/)[0].toLowerCase();
      if (low.includes(name.toLowerCase()) || (first.length >= 4 && low.includes(first))) {
        return name;
      }
    }
    return null;
  }

  // --- curated tips library --------------------------------------------------
  // Keyed by subField first, then field. Hand-written; keep accurate + tight.
  const INTERVIEW_TIPS = {
    "Investment Banking": [
      "Nail the technicals: the 3 financial statements & how they link, DCF, and accretion/dilution.",
      "Rehearse “walk me through your résumé” and a crisp “why banking / why us”.",
      "Know 1–2 recent deals the bank did and have a view on them.",
      "Behavioral fit matters as much as the technicals — be someone they’d staff at 2am.",
    ],
    "Private Equity": [
      "Be able to build a paper LBO and explain the drivers of returns (leverage, growth, multiple).",
      "Have an investment view: what makes a good deal, and a company you’d buy and why.",
      "Expect to defend your banking/consulting deal experience in detail.",
    ],
    "Hedge Fund": [
      "Come with a stock pitch — a clear long or short thesis, the catalyst, and the risks.",
      "Sharpen mental math and know what markets did recently and why.",
      "Show a framework for position sizing and being wrong gracefully.",
    ],
    "Asset Management": [
      "Prepare a pitch and understand portfolio construction (risk, diversification, benchmark).",
      "Have a view on the macro backdrop and where you’d allocate.",
      "Know “why asset management” vs. banking or a hedge fund.",
    ],
    "MBB": [
      "The case is everything: structure the problem, drive the analysis, and do clean mental math.",
      "Practice market-sizing out loud and always tie back to the client’s core question.",
      "Prep your PEI / behavioral stories (leadership, impact) — they’re scored too.",
    ],
    "Big 4": [
      "Focus on behavioral fit and a genuine “why this firm / why audit (or tax)”.",
      "Brush up on core accounting basics and show attention to detail.",
    ],
    "Consulting": [
      "Master the case interview: structure, hypothesis, and communicating as you go.",
      "Practice market-sizing and have 2–3 strong behavioral stories ready.",
    ],
    "Finance": [
      "Know the 3 statements, a basic DCF, and “why this firm” cold.",
      "Have a market view and one company you find interesting, with reasons.",
    ],
    "Technology": [
      "Grind data-structures & algorithms (arrays, hash maps, trees, graphs) on a whiteboard-timer.",
      "Talk through your projects with the STAR method and know the basics of system design.",
    ],
  };

  const GENERAL_INTERVIEW_TIPS = [
    "Research the firm and the specific role — come with a reason you want *this* one.",
    "Use the STAR method (Situation, Task, Action, Result) for behavioral answers.",
    "Have a tight “tell me about yourself” and 2–3 thoughtful questions to ask them.",
    "Send a short thank-you note after — it’s low effort and remembered.",
  ];

  function tipsForCompany(companyName) {
    const list = liveOpenings();
    const o = list.find((x) => x.company === companyName);
    if (!o) return null;
    return INTERVIEW_TIPS[o.subField] || INTERVIEW_TIPS[o.field] || null;
  }

  // --- FAQ -------------------------------------------------------------------
  const FAQ = [
    {
      keys: ["what is promptly", "what does promptly", "how does promptly", "what can you do", "how do you work"],
      answer:
        "Promptly watches 110+ company career pages and federal job sites, then alerts you the moment internships in your field open — so you can apply first. Set your school, grad year, and field in <b>Profile</b>, and we handle the watching.",
    },
    {
      keys: ["free", "cost", "how much", "price", "pay"],
      answer: "Promptly is completely <b>free</b> for students.",
    },
    {
      keys: ["set up", "setup", "get started", "get alerts", "turn on", "notifications", "how do i use"],
      answer:
        "Open <b>Profile</b> and set your school, graduation year, and field of interest. Then go to <b>Alerts</b> to switch on email + push notifications — you’ll get pinged when matching roles open.",
      action: { label: "Open Alerts", view: "alerts" },
    },
    {
      keys: ["apply", "does promptly apply", "submit", "application for me"],
      answer:
        "Promptly doesn’t submit applications — we alert you fast so you can apply first on the employer’s official site. Tap any opening to go straight to the real posting.",
    },
    {
      keys: ["save", "track", "bookmark", "star"],
      answer:
        "Tap the star on any opening to save it. Your saved alerts live in the <b>Saved</b> tab.",
      action: { label: "Open Saved", view: "saved" },
    },
  ];

  // --- intent engine ---------------------------------------------------------
  // Returns { html, action? }. Only known intents produce answers; everything
  // else falls back to the support email. This IS the guardrail.
  function answer(raw) {
    const text = (raw || "").trim();
    const low = text.toLowerCase();
    if (!low) return null;

    // greeting
    if (/^(hi|hey|hello|yo|sup|hiya|howdy)\b/.test(low) && low.length < 12) {
      return { html: "Hey! I can help with internship deadlines, interview tips, and how Promptly works. What do you need?" };
    }
    if (/\b(thank|thanks|thx|ty|appreciate)\b/.test(low)) {
      return { html: "Anytime — go get that offer. 👊" };
    }

    const company = matchCompany(low);
    const wantsDeadline = /\b(deadline|when|open|opens|close|closes|due|apply by|application)\b/.test(low);
    const wantsInterview = /\b(interview|prep|prepare|prepping|questions|technical|case)\b/.test(low);
    const wantsBrowse = /\b(show|see|browse|what\s|which|list|open(ings)?|available|any )\b/.test(low);

    // 1) interview tips (company- or industry-specific when possible)
    if (wantsInterview) {
      let tips = null;
      let label = "";
      if (company) {
        tips = tipsForCompany(company);
        label = ` for <b>${esc(company)}</b>`;
      }
      if (!tips) {
        // industry keyword?
        const key = Object.keys(INTERVIEW_TIPS).find((k) =>
          low.includes(k.toLowerCase())
        );
        if (key) { tips = INTERVIEW_TIPS[key]; label = ` for <b>${esc(key)}</b>`; }
      }
      if (!tips) tips = GENERAL_INTERVIEW_TIPS;
      return {
        html:
          `<b>Interview tips${label}:</b><ul>` +
          tips.map((t) => `<li>${t}</li>`).join("") +
          "</ul>",
      };
    }

    // 3) deadline / "when does X open" — real data only
    if (company && (wantsDeadline || /\brecruit/.test(low))) {
      const roles = liveOpenings().filter((o) => o.company === company);
      if (roles.length) {
        const r = roles[0];
        const when = esc(r.deadline || r.opened || "See posting");
        const link = r.sourceUrl
          ? ` <a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">View the posting →</a>`
          : "";
        return {
          html:
            `<b>${esc(company)}</b> — ${esc(r.role)}<br>` +
            `🗓 ${when}.${link}<br>` +
            `<span class="ap-hint">I’ll alert you the moment it opens if it’s in your field.</span>`,
        };
      }
    }

    // 4) browse / what's open
    if (wantsBrowse) {
      const list = liveOpenings();
      const openCount = list.filter(isOpenNow).length;
      if (company) {
        const roles = liveOpenings().filter((o) => o.company === company);
        if (roles.length) {
          return {
            html:
              `${esc(company)} has ${roles.length} role${roles.length > 1 ? "s" : ""} on Promptly right now.`,
            action: { label: "Open the feed", view: "openings" },
          };
        }
      }
      return {
        html: `There are <b>${openCount}</b> internships open on Promptly right now. Want to browse them?`,
        action: { label: "Open the feed", view: "openings" },
      };
    }

    // 5) FAQ
    for (const item of FAQ) {
      if (item.keys.some((k) => low.includes(k))) {
        return { html: item.answer, action: item.action };
      }
    }

    // 6) off-script — guardrail fallback to a real human
    return {
      html:
        "I can only help with <b>internship deadlines, interview tips, and how Promptly works</b> right now. " +
        `For anything else, email us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> and a human will get back to you.`,
      offscript: true,
    };
  }

  // Starter chips shown when the panel opens.
  const SUGGESTIONS = [
    "How do I use Promptly?",
    "When does Goldman Sachs open?",
    "Interview tips for investment banking",
    "What internships are open?",
  ];

  // --- UI --------------------------------------------------------------------
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function build() {
    if (document.querySelector(".ap-launcher")) return;

    const launcher = el(
      "button",
      "ap-launcher",
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5a8 8 0 0 1 5-14h5a8 8 0 0 1 8 8Z"/></svg><span>Ask Promptly</span>'
    );
    launcher.setAttribute("aria-label", "Ask Promptly");
    launcher.setAttribute("type", "button");

    const panel = el("div", "ap-panel", `
      <div class="ap-head">
        <div class="ap-title"><span class="ap-dot"></span> Ask Promptly</div>
        <button class="ap-close" type="button" aria-label="Close">✕</button>
      </div>
      <div class="ap-log" role="log" aria-live="polite"></div>
      <div class="ap-chips"></div>
      <form class="ap-form">
        <input class="ap-input" type="text" autocomplete="off"
          placeholder="Ask about deadlines, interviews, openings…" aria-label="Your question" />
        <button class="ap-send" type="submit" aria-label="Send">↑</button>
      </form>`);
    panel.hidden = true;

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    const log = panel.querySelector(".ap-log");
    const chipsWrap = panel.querySelector(".ap-chips");
    const form = panel.querySelector(".ap-form");
    const input = panel.querySelector(".ap-input");

    function addMsg(who, html) {
      const row = el("div", `ap-msg ap-${who}`, html);
      log.appendChild(row);
      log.scrollTop = log.scrollHeight;
      return row;
    }

    function runAction(action) {
      if (!action || !action.view) return;
      const btn = document.querySelector(`.nav-item[data-view="${action.view}"], [data-view="${action.view}"]`);
      if (btn) btn.click();
      close();
    }

    function ask(qText) {
      addMsg("user", esc(qText));
      const res = answer(qText);
      if (!res) return;
      const row = addMsg("bot", res.html);
      if (res.action) {
        const b = el("button", "ap-action", esc(res.action.label));
        b.type = "button";
        b.addEventListener("click", () => runAction(res.action));
        row.appendChild(b);
      }
      log.scrollTop = log.scrollHeight;
    }

    function renderChips() {
      chipsWrap.innerHTML = "";
      SUGGESTIONS.forEach((s) => {
        const c = el("button", "ap-chip", esc(s));
        c.type = "button";
        c.addEventListener("click", () => { ask(s); });
        chipsWrap.appendChild(c);
      });
    }

    let greeted = false;
    function open() {
      panel.hidden = false;
      launcher.classList.add("ap-open");
      requestAnimationFrame(() => panel.classList.add("ap-visible"));
      if (!greeted) {
        addMsg("bot", "Hi! I’m the Promptly helper. Ask me about internship deadlines, interview prep, or how the app works.");
        renderChips();
        greeted = true;
      }
      setTimeout(() => input.focus(), 120);
    }
    function close() {
      panel.classList.remove("ap-visible");
      launcher.classList.remove("ap-open");
      setTimeout(() => { panel.hidden = true; }, 180);
    }

    launcher.addEventListener("click", () => (panel.hidden ? open() : close()));
    panel.querySelector(".ap-close").addEventListener("click", close);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      input.value = "";
      ask(v);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) close();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
