# summary-reflects-dom-selection

## Evidence trail
Model is write-only from events; every skipped event diverges. Known skip mechanisms:
1. Listener not attached yet (`early-interaction-not-lost`).
2. `form.reset()` doesn't fire `change` (`app.js:238`) → delivery radio vs `orderState.deliveryMethod` (`delivery-estimate-matches-selection`).
3. Browser form restoration on back/forward (`restored-form-state-reflected`).
4. `changeQuantity` sets `input.value = NaN` → field shows "" but model is NaN (`quantity-within-bounds`).
5. Typed `0` → model 1, field 0 (`app.js:132`).

## Oracle definition
`state_from_dom()` = checked `base-potion`, `size`, `potency`, set of checked `ingredient`, `int(#quantity.value)`, checked `delivery`.
`state_from_model()` = `page.evaluate("orderState")` fields of the same names, plus the summary text parsed back (potion name, "Size: …", "Potency: …", "Quantity: N").
Compare **both** model and summary text: the summary is rendered from the model, but checking it guards against render bugs.

## Key observations
- `featuredAdded` has no DOM representation after the 2 s button feedback, so it cannot be compared to the DOM. The workload tracks it from its own click history instead.
- This oracle dominates several narrower properties (see `property-relationships.md`). Keep the narrow ones for distinct messages and diagnosis.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.
- Workload: `Always(dom == model, "summary matches DOM selection")` — missing.

## Open questions
- How should `featuredAdded` be compared to the DOM? Today it can't be; see `featured-button-state-truthful`.
