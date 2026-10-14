# featured-charge-matches-sale-price

## Evidence trail
- `featuredTotal = 36` hard-coded (`app.js:188-190`).
- Advertised: original 40, sale 34, badge "15% OFF" (`index.html:29,37-38`). 40 × 0.85 = 34.

## Probe result
Probe: Python Playwright 1.x, headless Chromium, local static server, Google Fonts stubbed via `page.route`, run 2026-10-14 (`scratchpad/probe.py`, `probe2.py`; not committed). Healing + featured: 64.00 shown (25 + 36 + 3) vs 62.00.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
None.
