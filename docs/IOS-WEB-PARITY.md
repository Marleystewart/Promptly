# Web vs iOS parity

Audited 18 Sep 2026.

## The thing to know first

**The iOS app is the website.** `capacitor.config.json` sets `webDir: "www"`, and
[`scripts/build-web.js`](../scripts/build-web.js) copies the same `index.html`,
`styles.css`, `script.js`, `onboarding.js`, `watchlist.js` and `assistant.js`
into it. There is no second implementation.

So typography, colour, spacing, components, forms, modals, AI interactions, API
behaviour, error handling and empty states **cannot** drift between platforms —
they are the same bytes. Auditing them screen by screen would only confirm that.

The two platforms can only differ where the code *asks* which platform it is on.
That is a closed set, listed below, and it is the whole surface area of this
audit.

## Where they are allowed to differ

### CSS — one block, `styles.css` "Native iOS app only" (30 rules)

Scoped by `html.native-app`, set by `index.html`'s head script.

| Difference | Why | Status |
|---|---|---|
| `body` gets `padding-top: env(safe-area-inset-top)` | clears the status bar under `viewport-fit=cover` | MATCHES (intended) |
| `overscroll-behavior: none` | no rubber-band past the app's own content | MATCHES (intended) |
| Auth submit spacing, student hint centred | thumb spacing on a real phone | MATCHES (intended) |
| Tour card padding and type scaled down (4 rules) | the web card is too tall for a phone | MATCHES (intended) |
| Profile tab shows the user's avatar, not an icon | native tab-bar convention | MATCHES (intended) |
| Bottom bar shrinks on scroll down | transform + opacity only, so it does not relayout per frame | MATCHES (intended) |
| Listing details open as a full-screen sheet | a floating card with the page around it is a web idiom | MATCHES (intended) |
| `mega-logo` / `modal-logo` sized down | proportion on a phone | MATCHES (intended) |
| Tap highlight off, `touch-action: manipulation`, no callout/selection, `:active` opacity | removes the grey WebKit flash and the 300ms feel | MATCHES (intended) |

Verified in-browser with the native class applied: the details sheet computes
`position: fixed`, full-viewport, radius 0, with safe-area padding — correct.

### JavaScript — 7 branches

| Branch | Why | Status |
|---|---|---|
| `API_BASE` absolute in native (`script.js:7`) | the shell loads from `capacitor://localhost`, which has no `/api` | MATCHES (required) |
| `native-app` class + viewport (`onboarding.js`) | scopes the CSS above | **FIXED** — see below |
| Avatar in the profile tab (`script.js:3950`) | pairs with the CSS rule | MATCHES (intended) |
| `scrollTo` uses `auto`, not `smooth` (`script.js:1769`) | smooth scrolling reads as lag in a webview | MATCHES (intended) |
| Push via APNs, not Web Push (`script.js:4470`) | WKWebView has no `PushManager` at all | MATCHES (required) |
| Service worker not registered (`script.js:5372`) | the shell serves its own bundle | MATCHES (required) |
| Live feed cache written only in native (`script.js:5423`) | so a cold launch has something to paint | MATCHES (intended) |

## What was actually wrong

### 1. The app did not open on the website's launch screen — FIXED

The website opens on a launch screen: the app icon with the Promptly wordmark
under it (`index.html`, `.launch-screen`). The native shell covered it with
*different* artwork — the bolt alone, no wordmark — and because that cover is
only lifted once the session and feed have resolved, the real launch screen
underneath had already been passed by the time anyone could see it.

One codebase, two different openings. The cover now renders the site's own
lockup: same two files, same classes, so `styles.css` styles it identically.
Measured on 375×812, the cover's icon and wordmark match the launch screen's on
every computed value — width, height, border-radius, filter, shadow.

**Trap worth remembering:** `index.html`'s `<style>` paints before `styles.css`
loads, so restating the sizes there is tempting — but an inline rule outranks
that file's media query and silently wins. A first attempt gave the cover 34px
corners against the site's 28px. `styles.css` owns the lockup; the inline block
owns only the ground it sits on.

### 2. The launch-jump fix had been undoing itself — FIXED

`index.html`'s head script sets the native class and viewport before any CSS or
content. Its own comment says why: *"The late version of this in onboarding.js
re-laid out the whole page after it was visible, which was the jump on every
launch."*

The early copy went in. **The late one was never removed.** `onboarding.js` runs
at the end of `<body>` and was assigning `meta[viewport].content` on every
launch — the same string that was already there, but assigning it at all makes
WebKit re-parse the viewport and relayout, after the app is visible. Now guarded
so it only writes when the value would actually change.

### 3. The lockup was too small on a phone — FIXED

Both sizes were `clamp(min, 22vw, max)`, but 22vw is 82px on a 375px phone —
under the 116px floor. The middle term never applied on any phone, so the icon
never grew with the screen and every phone got the floor. Floors raised and the
`vw` terms set to take over at phone width: icon 116 → 143px, wordmark
150 → 184px on a 375px screen, ratio held at 1:1.29.

## Open, and needing a device

I could not build or run iOS here — Xcode is not installed on this machine
(`xcode-select` points at Command Line Tools), `simctl` lists no simulators, and
there is no iOS CI. Everything above was verified in a browser with the native
shell simulated. These need a real device:

- **Keyboard.** There is no `visualViewport` handling anywhere, and `.mobile-nav`
  is `position: fixed` at the bottom. `@capacitor/keyboard` is not installed, so
  the app relies on WKWebView's default behaviour. Whether a focused field near
  the bottom is ever covered is only answerable on hardware. **Not changed** —
  it is not reproducible here, and guessing at it would be a change nobody can
  check.
- **Perceived launch speed.** The cover lifts on readiness with a 3.5s cap; the
  real distribution of that wait is a device measurement.
- **Scroll feel** of the shrink-on-scroll bar under real momentum.

## Deliberately not changed

- **`assets/wordmark.png`.** It is a boxed lockup drawn for a dark page, so the
  bolt appears inside it as well as above it on the launch screen, and it needs
  a filter to be legible on white. That is a brand-asset decision, not a bug to
  fix in CSS — and the brief is that the website is the reference. If a
  light-theme wordmark (or an SVG) ever exists, swapping the file fixes both
  platforms at once. It is also a 480×320 PNG drawn at 184px, so it is soft.
- **19 dead `letter-spacing` declarations.** `styles.css` opens with
  `* { letter-spacing: 0 !important }` from the repo's first commit, and because
  `*` has zero specificity every tracking value authored since loses to it
  silently. Reviving them is a whole-app typography change, on both platforms,
  that nobody can currently check on a phone.
- **10 × `100vh` with no `dvh` fallback.** Worth doing, but it changes nothing
  in the app: a webview has no collapsing toolbar, so `vh` and `dvh` are equal
  there. It repairs the mobile *website*.

## Before shipping

`scripts/bump-version.js` — bump the shared `?v=` cache-bust **on `main` after
merging**, per that script's own note. Without it, returning users get new HTML
against cached old CSS.
