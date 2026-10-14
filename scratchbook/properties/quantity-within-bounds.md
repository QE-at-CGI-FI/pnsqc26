# quantity-within-bounds

## Evidence trail
See `total-is-finite-nonnegative`. Additional divergences:
- Typed "0": `parseInt("0") || 1` → model 1, field shows 0.
- Typed "2.7": model 2, field shows 2.7.
- Typed "150": model 150 (`max="99"` only affects native validation and spinners, and the input is outside the form, so it is never validated).

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.
- `Always(int in 1..99, "quantity within bounds")` — missing.
- `Always(model == field, "quantity model matches field")` — missing.

## Open questions
None.
