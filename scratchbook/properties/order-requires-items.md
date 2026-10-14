# order-requires-items

## Evidence trail
- `handleFormSubmit` (`app.js:221-239`) performs no order-content checks. The only gate is HTML `required` on name, castle, and kingdom.

## Probe result
Probe: Python Playwright 1.x, headless Chromium, local static server, Google Fonts stubbed via `page.route`, run 2026-10-14 (`scratchpad/probe.py`, `probe2.py`; not committed). Customer fields filled, no potion selected → modal active, order number issued, total 3.00 gold.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
- Is a featured-only order valid? Assumed yes; the invariant accepts it.
