# restored-form-state-reflected

## Evidence trail
- `orderState` initialized from constants (`app.js:34-47`); `updateOrderSummary()` on DOMContentLoaded renders from those constants, never reading the DOM.
- Browsers may restore form control state on history navigation without firing `change`.

## Probe result
Probe: Python Playwright 1.x, headless Chromium, local static server, Google Fonts stubbed via `page.route`, run 2026-10-14 (`scratchpad/probe.py`, `probe2.py`; not committed).
- Reload (`page.reload()`): Wisdom **not** restored; model None. Consistent.
- Navigate away then `go_back()`: Wisdom checked = True, `orderState.basePotion` = None → **divergence**. The model being None (not "wisdom") shows this was a fresh document with form restoration, not a bfcache restore of the whole JS heap.

## Failure scenario
The shopper goes back to the shop page; their previous selections appear checked; the summary shows "No potion selected" and a total of 3.00. Submitting confirms an empty order.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.
- Workload: `Always(dom == model, "summary matches DOM after reload/back-forward")` — missing.
- Workload: `Sometimes(restored non-default state, "browser restored non-default form state")` — missing.

## Open questions
- Are browsers other than Chromium in scope? Firefox restores on reload too, which would widen the trigger. Not investigated: the topology is Chromium-only.

### Investigation Log

#### Does headless Chromium restore radio/checkbox state on reload or bfcache for this page?
- Examined: probe2.py (reload and back/forward paths) in headless Chromium.
- Found: no restoration on reload; restoration on back navigation, with model/DOM divergence.
- Conclusion: resolved. Property is reachable in Chromium via back/forward; priority raised P3 → P2.
