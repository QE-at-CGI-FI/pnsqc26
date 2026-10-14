# order-numbers-unique

## Evidence trail
`'EB-' + Math.floor(Math.random() * 90000 + 10000)` (`app.js:226`). That gives 90 000 values; the birthday bound reaches ~50% collision probability at ~350 orders.

## Key observation
Antithesis makes randomness deterministic and explorable. Low product value for a client-only demo; included because it is cheap and shows the pattern for real ID generation.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
None.
