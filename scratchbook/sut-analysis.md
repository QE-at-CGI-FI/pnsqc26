---
sut_path: /Users/maaretp/Documents/cgi-code/two-versions/version1
commit: 4cc12c71000a270bc68718e13b1cf0850b102254
updated: 2026-10-14
external_references: []
---

# SUT Analysis — The Enchanted Brew Shop (version1)

## Summary

A single static web page: a potion "builder" with live order summary, a featured-potion upsell, a customer/delivery form, and a confirmation modal. There is **no backend, no network API, no persistence, and no storage** — every behavior lives in `js/app.js`, running on the browser's single-threaded event loop, mutating one global `orderState` object and re-rendering the summary from it.

The research ran in **single-agent mode** (all 12 SUT-discovery focuses as sequential passes). Scope answer from the user: *"Just this directory"* — no external references.

Headline for Antithesis planning: the classic Antithesis strengths (partitions, crash recovery, replication) have almost nothing to bite on here. What remains valuable is:

1. **Load-time timing** — the page is visible and clickable before `app.js` has loaded and attached listeners. Network latency between browser and web server decides whether user input is lost.
2. **Combinatorial exploration of UI action sequences** checked against an independent price model and a DOM↔state consistency oracle (Antithesis as a guided, replayable fuzzer of user sessions).
3. **Timer-sensitive UI** (the 2-second featured-button reset) under CPU throttling.

Many defects visible in the code are deterministic and would be caught more cheaply by unit or Playwright tests; see "Antithesis fit" and `evaluation/synthesis.md`.

## Architecture and Data Flow (Focus 1)

```
browser ──GET──> static server: index.html
                 ├─ css/style.css            (render-blocking)
                 ├─ fonts.googleapis.com CSS (render-blocking, EXTERNAL)
                 ├─ images/featured-potion.png (MISSING in repo)
                 └─ js/app.js  (classic <script> at end of <body>, index.html:376)
```

- **Entrypoint:** `DOMContentLoaded` → `initEventListeners()` + `updateOrderSummary()` (`app.js:50-53`).
- **Event wiring:** `change` listeners on radios/checkboxes (`app.js:55-91`); `change` + `input` on `#quantity`; `submit` on `#order-form`. Inline `onclick=` attributes call globals `changeQuantity`, `addFeaturedToOrder`, `closeModal` (`index.html:40,183,185,302,308`). Global `click` and `keydown` listeners close the modal (`app.js:247-259`).
- **Request path (one interaction):** DOM event → handler reads `event.target.value` / `dataset.*` → mutates `orderState` → `updateOrderSummary()` re-derives all text from `orderState` (never from the DOM).
- **DOM structure that matters:** `<form id="order-form">` (`index.html:235-296`) wraps **only** customer fields and the delivery radios. Potion, size, ingredients, potency and quantity controls are **outside** the form.

## State Management and Persistence (Focus 2)

- Single source of truth: `let orderState` (`app.js:34-47`), initialized with **hard-coded defaults** (`size:'vial'`, `potency:'standard'`, `deliveryMethod:'owl'`, `deliveryPrice:5`, `quantity:1`, `basePotion:null`) — not read from the DOM at startup.
- **Three independent copies of price data** that can disagree:
  - visible label text (e.g. "+20 gold", "1.5x price"),
  - `data-price` / `data-multiplier` attributes,
  - JS constants (`SIZE_MULTIPLIERS`, `SIZE_NAMES`, hard-coded featured `36`).
  Size uses the JS constant and ignores `data-multiplier`; ingredients/potion/delivery use `data-price`; potency uses `data-multiplier`.
- **State/DOM drift mechanisms** (code-verified):
  - `form.reset()` (`app.js:238`) resets the delivery radio to "owl" without firing `change`, so `orderState.deliveryMethod/deliveryPrice` keep their old values.
  - Builder controls are outside the form, so `reset()` leaves them untouched; `featuredAdded` is never reset.
  - Any `change` event that fires before listeners are attached is lost forever.
  - Browser form-state restoration on reload/back-forward sets `checked` without firing events (browser-dependent; open question).
- No `localStorage`, cookies, or server calls. Nothing persists across reloads (except browser form restoration).
- `#quantity` writes: `handleQuantityChange` (`app.js:130-134`) does `parseInt(value) || 1` with **no clamping**; `changeQuantity` (`app.js:143-151`) clamps to 1..99 but does not handle `NaN`.

## Concurrency Model (Focus 3)

- One JS thread; handlers run to completion, so no data races inside `orderState`.
- Concurrency that does exist:
  - **Parser vs. user:** HTML above `<script src="js/app.js">` is parsed and painted while the script is downloading. Users can interact; nothing is listening yet. Inline `onclick` handlers reference functions not yet defined → `ReferenceError`.
  - **Timer vs. user:** `setTimeout(…, 2000)` in `addFeaturedToOrder` (`app.js:216-219`) re-enables the button; clicks interleave with it.
  - **Event coalescing:** `#quantity` fires both `input` and `change`; programmatic `input.value = …` in `changeQuantity` fires neither.
- Parallel browser sessions share no state (no backend), so cross-session concurrency is irrelevant except CPU contention.

## Safety Guarantees — claimed, to be tested (Focus 4)

The UI text constitutes the only "spec". Claims made by the page (not verified facts):

- Size: Flask "1.5x price" (`index.html:106`, `SIZE_NAMES.flask`), Bottle "2x price" (`index.html:114`) vs "Bottle (2.5x)" (`app.js:24`).
- Potency: "+25% price", "+75% price".
- Ingredient prices as labeled (e.g. Phoenix Feather "+20 gold" `index.html:137`; Starlight Dew "+12 gold" `index.html:152`).
- Featured potion "34 gold" (15% off 40) (`index.html:37-38`).
- Delivery Owl "5 gold", Dragon "15 gold" (`index.html:270,278`).
- Quantity bounded 1..99 (`min`/`max` attributes, `index.html:184`).
- Required fields: name, castle, kingdom (`required`).
- "Satisfaction guaranteed or your gold back" (footer) — not testable.

Code-level observations that contradict the claims (these motivate properties; they are what the code does, the properties decide whether it's wrong):

| Claim | Code behavior | Location |
|---|---|---|
| Flask 1.5x | multiplies by 1.35 | `app.js:10`, ignores `data-multiplier="1.5"` |
| Bottle 2x (label) / 2.5x (summary) | multiplies by 2.5 | `app.js:11`, `index.html:114` |
| Phoenix Feather +20 | charges 18 | `index.html:135` |
| Starlight Dew +12 | charges 10 | `index.html:150` |
| Featured 34 gold | charges 36 | `app.js:189` |
| Delivery 5/15 gold | never added to total | `app.js:199-200` (comment says so) |
| Quantity 1..99 | typed values unclamped; `NaN` reachable | `app.js:132`, `145-149` |

## Liveness Guarantees (Focus 5)

None explicitly claimed. Implicit: the page becomes interactive; a valid submission shows a confirmation; the modal can always be dismissed; the featured button re-enables after ~2 s.

## Bug History and Density (Focus 6)

No issue tracker or history in scope. Git history (4 commits) shows the code was added in one commit (`b0e837d Add two versions`). Footer: "edited for purposes of illustrating task expansion to tester role AI brings about" — **this page is very likely seeded with deliberate defects**. Treat the density of label/code mismatches as intentional test material, not evidence of an organic hotspot.

## Existing Test Strategy (Focus 7)

No tests of any kind. No CI test step (`.github/workflows/static.yml` at the repo root deploys static pages; not in SUT scope).

## Failure and Degradation Modes (Focus 8)

- **External font CSS** (`fonts.googleapis.com`) is render-blocking; unreachable in Antithesis (no internet). Behavior under a hanging request = delayed first paint.
- **Missing image** `images/featured-potion.png` → 404, broken image, no `alt`.
- **Slow `app.js`** → interactive-but-dead page; lost selections; `ReferenceError` from inline handlers.
- **No error handling anywhere**; `parseInt` of malformed input yields `NaN` which propagates to "NaN gold".
- **Empty-order submit**: only HTML `required` on customer fields; no check that anything was ordered.

## External Dependencies (Focus 9)

- Google Fonts (CSS + font files) — cosmetic, but render-blocking.
- `https://wandergram.fake/…` link — dead link, not followed by workload.
- The browser itself (engine-specific behavior: form restoration, painting before end-of-body scripts).

## Product Context (Focus 10)

A shopper picks potion → size → ingredients → potency → quantity, optionally adds the featured potion, fills delivery details, submits, sees an order number and delivery estimate. **User-visible failures that matter most:** wrong price shown/charged; order placed for nothing; wrong delivery promise; lost selections. Cosmetic: header "Open dawn to dusk" vs footer "Open dusk to dawn"; review with 5 stars but "4/5" text; `<h5>` vs `<h4>` in footer.

## Unproven Assumptions (Focus 11)

- Assumes `app.js` is loaded before the user touches anything.
- Assumes the DOM's initial checked state equals `orderState` defaults (true for a fresh load in Chromium; not guaranteed after form restoration).
- Assumes `form.reset()` keeps the model in sync (it does not fire events).
- Assumes `parseInt(input.value)` is always a number.
- Assumes one featured potion per order (boolean flag) while the UI re-enables "Add to Order" after 2 s, implying repeat adds.
- Assumes order numbers from `Math.random()` (90 000 values) are unique.

## Wildcard (Focus 12)

- **The model is write-only from the DOM's perspective**: state is updated from events, never reconciled with the DOM. Every way an event can be skipped (late script, reset, restoration, programmatic value set) is a divergence bug. A single oracle — "after any settled action, summary == f(checked DOM controls)" — catches the whole class.
- **The quantity input has `tabindex="-1"`** (`index.html:184`): keyboard users cannot reach it; combined with no clamping on typed input this is a mouse-only safe path.
- **Price data has three sources of truth**; which one is "the spec" is a product decision (see Biases in `evaluation/synthesis.md`).
- `orderState` is a top-level `let` in a classic script, so it lives in the global lexical environment: the workload can read it via `page.evaluate("orderState")` **without any SUT change**. This makes model-vs-DOM checks cheap.
- Antithesis controls randomness, so `Math.random()` order numbers become deterministic per timeline — collision search is feasible.

## Antithesis Fit

| Area | Fit | Why |
|---|---|---|
| Interaction before script load | **Strong** | Pure timing; depends on network latency the platform injects |
| Random UI action sequences vs. oracle | Good | Large combinatorial space; replayable failures |
| Featured timer under throttling | Moderate | Timer/click interleavings |
| Static price/label mismatches | Weak | Deterministic; unit/Playwright tests find them in milliseconds |
| Distributed faults, crash recovery, clocks | None | No server state, no clock use |

## Assumptions

- Target browser is Chromium (headless, via Playwright). Firefox-specific form restoration is noted but not planned.
- Visible UI labels are treated as the product's claimed spec when label and code disagree.
- The SUT is served as static files by any HTTP server; production hosting (GitHub Pages per repo workflow) is out of scope.

## Open Questions

- Which source of truth is authoritative for prices — labels, `data-*` attributes, or JS constants? `(needs human input)`
- Should delivery be part of the total? The code comment says "delivery not included", which reads as a deliberate (if odd) choice. `(needs human input)`
- After a confirmed order, should the builder reset, persist, or is either fine? `(needs human input)`
- Is there an official Antithesis JavaScript SDK usable in-browser? The `antithesis-documentation` skill was not available in this session; plan assumes the Python SDK in the workload only.
