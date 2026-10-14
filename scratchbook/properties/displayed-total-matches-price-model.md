# displayed-total-matches-price-model

## Evidence trail
Three sources of truth for prices (labels, `data-*`, JS constants) that disagree in several places; see `sut-analysis.md` claim table. The umbrella oracle compares the displayed total to a model built **only from visible labels**:

```
potion = label(base) × label_mult(size) × label_mult(potency)
subtotal = potion × qty + Σ label(ingredients) + 34 × featured
total = subtotal + 3            # + delivery if total-includes-delivery confirmed
```
(Ingredients not multiplied by qty to match current semantics; switch if `ingredients-scale-with-quantity` is confirmed.)

## Probe results
Probe: Python Playwright 1.x, headless Chromium, local static server, Google Fonts stubbed via `page.route`, run 2026-10-14 (`scratchpad/probe.py`, `probe2.py`; not committed).
- Healing + Flask: shown 36.75, model 40.50.
- Healing + Phoenix Feather: shown 46.00, model 48.00.
- Healing + featured: shown 64.00, model 62.00.

## Key observations
- Bottle has two labels ("2x price" on the card, "Bottle (2.5x)" in the summary). The model must pick one; parameterize it.
- Float comparisons: use a tolerance of 0.005 on the parsed `toFixed(2)` text.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.
- Workload: `Always(|shown − model| < 0.005, "displayed total matches label price model")` — missing.

## Open questions
- Are visible labels the spec, or are JS constants or `data-*` attributes? (needs human input)

### Investigation Log

#### Are visible labels the spec?
- Examined: `index.html` labels and `data-*`, `app.js` constants and comments, git log (one content commit), footer attribution.
- Found: no comment or doc names an authoritative source. Code is internally inconsistent (size ignores `data-multiplier` while potency uses it). The footer says the page was edited to illustrate testing, which suggests the mismatches are deliberate seeds.
- Not found: any product spec.
- Conclusion: `(needs human input)`.
