# no-uncaught-script-errors

*Added during evaluation (gap fill, Coverage Balance + Wildcard lenses).*

## Evidence trail
- Inline handlers: `onclick="addFeaturedToOrder()"` (`index.html:40`), `changeQuantity(-1/1)` (`:183`, `:185`), `closeModal()` (`:302`, `:308`). These globals are defined only when `app.js` executes.
- `updateOrderSummary` dereferences `querySelector(...)` results without null checks (`app.js:153-205`). This is safe with the current HTML, but would throw if the markup changed.

## Probe result
Probe: Python Playwright 1.x, headless Chromium, local static server, Google Fonts stubbed via `page.route`, run 2026-10-14 (`scratchpad/probe.py`, `probe2.py`; not committed). Clicking "+" during a delayed `app.js` produced `ReferenceError: changeQuantity is not defined`.

## Failure scenario
A click is lost and the console shows an error. Combined with `early-interaction-not-lost`, the quantity the shopper thinks they set is ignored.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.
- Workload: `Always(no pageerror, "no-uncaught-script-errors")` — missing.
- Workload: `Unreachable("inline handler called before definition")` keyed on `/is not defined/` — missing.

## Open questions
None.
