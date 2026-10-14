# rich-order-states-reached

## Rationale
Several safety properties are sequence-dependent (`delivery-estimate-matches-selection` needs dragon → order → order; `total-is-finite-nonnegative` needs an empty field and then "+"). Without anchors, a random driver might rarely reach them and the safety checks would pass vacuously.

Anchors (each a distinct `Sometimes` message):
- confirmed with dragon delivery
- confirmed with qty ≥ 10 and ≥ 3 ingredients
- featured added and base potion selected
- second order in same session confirmed
- quantity field empty or non-numeric at action time

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
None.
