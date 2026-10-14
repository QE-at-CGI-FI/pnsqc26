# money-rounding-consistent

## Evidence trail
- Fractional gold is reachable: 25 × 1.35 × 1.25 = 42.1875, displayed via `toFixed(2)` (`app.js:197,203`).
- `toFixed` has binary-float edge cases (e.g. x.xx5 values).
- The static HTML shows "0 gold"/"3 gold", while JS shows "0.00 gold"/"3.00 gold": format differs before and after hydration.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
- Is fractional gold intended at all? (needs human input)

### Investigation Log

#### Is fractional gold intended?
- Examined: all price labels (all integers), multipliers (1.35, 1.25, 1.75 produce fractions), `toFixed(2)` rendering.
- Found: every advertised price is an integer, but the code deliberately renders 2 decimals.
- Conclusion: `(needs human input)`.
