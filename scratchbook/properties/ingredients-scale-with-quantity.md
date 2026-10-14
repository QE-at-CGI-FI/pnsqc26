# ingredients-scale-with-quantity

## Evidence trail
`subtotal = (potionSubtotal * quantity) + ingredientsTotal + featuredTotal` (`app.js:193`). The UI places ingredients in the potion-crafting flow ("Add Special Ingredients" between size and potency), which suggests they are part of each potion.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
- Are ingredients per potion or per order? (needs human input)

### Investigation Log

#### Per potion or per order?
- Examined: builder section order in `index.html`, `app.js:193`, summary (a single "Ingredients" line with no per-unit text).
- Found: the UI flow implies per potion; the code implements per order; no text disambiguates.
- Conclusion: `(needs human input)`.
