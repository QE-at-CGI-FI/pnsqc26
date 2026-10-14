# early-interaction-not-lost

## Evidence trail
- `<script src="js/app.js">` is a classic, parser-blocking script at the very end of `<body>` (`index.html:376`). Everything above it is parsed and can be painted and clicked before the script runs.
- Listeners are attached only in `DOMContentLoaded` (`app.js:50-53` → `initEventListeners`, `app.js:55-91`). A `change` event fired before that has no listener and is never replayed.
- `orderState` starts from hard-coded defaults (`app.js:34-47`) and is never reconciled with the DOM.

## Probe result
Probe: Python Playwright 1.x, headless Chromium, local static server, Google Fonts stubbed via `page.route`, run 2026-10-14 (`scratchpad/probe.py`, `probe2.py`; not committed). With `app.js` delayed 3 s by the server, the driver clicked the Strength card and "+" before load. After load: DOM `input[value=strength]` checked = True, `orderState.basePotion` = None, total "3.00 gold". Also `pageerror: changeQuantity is not defined` (see `no-uncaught-script-errors`).

## Failure scenario
Slow network → the shopper picks a potion, ingredients, and size; the cards show as selected; the summary says "No potion selected" (or shows a partial selection if some clicks landed after hydration); the order is priced and confirmed without them.

## Key observations
- Partial loss is the interesting case: some clicks land before hydration, some after. The model then reflects only the later ones. Antithesis latency faults are exactly what varies this split.
- Render-blocking CSS (`css/style.css`, Google Fonts) delays first paint and *shrinks* the window. Stubbing fonts (see topology) changes the window size, which is fine but worth knowing.
- Detection needs the workload to start acting at `commit`/`domcontentloaded`, not after `load`.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.
- Workload: `Always(model == f(DOM), "early-interaction: model matches DOM after hydration")` — missing.
- Workload: `Sometimes(acted_before_load, "early-interaction: user acted before app.js loaded")` — missing.
- Optional SUT marker: `console.debug("ANTITHESIS:hydrated")` at the end of the DOMContentLoaded handler, so the workload knows precisely which actions preceded hydration — missing.

## Open questions
- Remediation choice (read DOM at init vs. block interaction) changes only the fix, not the invariant. Not a blocker.
