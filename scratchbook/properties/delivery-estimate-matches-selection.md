# delivery-estimate-matches-selection

## Evidence trail
- `handleFormSubmit` (`app.js:221-239`) derives `deliveryDays` from `orderState.deliveryMethod`, not from the checked radio.
- `form.reset()` at the end resets the delivery radio to the default `owl` (`checked` attribute, `index.html:267`) **without firing `change`**, so `orderState.deliveryMethod` stays `dragon`.

## Probe result
Probe: Python Playwright 1.x, headless Chromium, local static server, Google Fonts stubbed via `page.route`, run 2026-10-14 (`scratchpad/probe.py`, `probe2.py`; not committed). Dragon → submit → estimate "Tomorrow" (correct). Close modal. DOM: owl checked = True; `orderState.deliveryMethod` = "dragon". Fill fields again, submit → estimate **"Tomorrow"** while Owl Post is shown selected.

## Failure scenario
Second order in a session promises next-day dragon delivery for an owl-post order. If delivery were ever priced (`total-includes-delivery`), it would also charge 15 instead of 5.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.
- Workload: `Always(estimate matches checked delivery, "confirmation delivery estimate matches selected delivery")` — missing.

## Open questions
None.
