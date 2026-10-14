# ingredient-charge-matches-label

## Evidence trail
- `handleIngredientChange` sums `parseInt(checkbox.dataset.price)` (`app.js:110-121`).
- Phoenix Feather `data-price="18"` (`index.html:135`) vs label "+20 gold" (`:137`).
- Starlight Dew `data-price="10"` (`:150`) vs label "+12 gold" (`:152`).
- The other four ingredients match.

## Probe result
Probe: Python Playwright 1.x, headless Chromium, local static server, Google Fonts stubbed via `page.route`, run 2026-10-14 (`scratchpad/probe.py`, `probe2.py`; not committed). Healing + Phoenix: 46.00 shown vs 48.00 label model.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
None.
