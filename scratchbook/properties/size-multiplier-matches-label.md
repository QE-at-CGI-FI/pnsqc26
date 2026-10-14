# size-multiplier-matches-label

## Evidence trail
- `SIZE_MULTIPLIERS = {vial:1, flask:1.35, bottle:2.5}` (`app.js:8-12`), used in `handleSizeChange` (`app.js:105`).
- `data-multiplier` on size radios (1 / 1.5 / 2.5, `index.html:94,102,110`) is **ignored** for size (potency does use its `data-multiplier`, `app.js:126`).
- Labels: Flask "150ml · 1.5x price" (`:106`), `SIZE_NAMES.flask` "Flask (1.5x)" (`app.js:23`); Bottle "500ml · 2x price" (`:114`) vs `SIZE_NAMES.bottle` "Bottle (2.5x)" (`app.js:24`).

## Probe result
Probe: Python Playwright 1.x, headless Chromium, local static server, Google Fonts stubbed via `page.route`, run 2026-10-14 (`scratchpad/probe.py`, `probe2.py`; not committed). Healing + Flask total 36.75 = 25 × 1.35 + 3.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
- Is Bottle meant to be 2x or 2.5x? (needs human input)

### Investigation Log

#### Is Bottle 2x or 2.5x?
- Examined: card label, `data-multiplier`, `SIZE_MULTIPLIERS`, `SIZE_NAMES`.
- Found: 3 sources say 2.5, the card label says 2x.
- Conclusion: `(needs human input)`. The majority suggests the card label is wrong, but that is a product decision.
