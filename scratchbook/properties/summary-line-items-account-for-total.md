# summary-line-items-account-for-total

## Evidence trail
- Potion line shows `basePotionPrice` only (`app.js:157`), not × size × potency × qty.
- Size, potency and quantity lines keep a static "-" price (`index.html:197-213`); JS updates only their names.
- No featured line exists; `featuredTotal` contributes silently (`app.js:186-193`).
- The ingredients line shows `ingredientsTotal` (correct for current semantics).

## Failure scenario
Healing + Flask + Maximum × 3 + featured: the lines show 25, -, -, 0, - and the subtotal is 213.19. Nothing shown explains the total.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
None.
