# total-includes-delivery

## Evidence trail
- `let total = subtotal + BREWING_FEE;` with comment "(note: delivery not included)" (`app.js:199-200`).
- `orderState.deliveryPrice` is maintained (`app.js:139`) but never read.
- Delivery options show a price ("5 gold", "15 gold", `index.html:270,278`). The summary has no delivery line.

## Failure scenario
The shopper selects Dragon Express expecting 15 gold more; the total is unchanged. Either they are under-charged, or they are charged later without having seen it.

## Interaction
If delivery is added to the total, the stale `deliveryPrice` after `form.reset()` (see `delivery-estimate-matches-selection`) becomes a charging bug.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
- Is excluding delivery intentional? (needs human input)

### Investigation Log

#### Is excluding delivery intentional?
- Examined: `app.js:199-200` comment, `deliveryPrice` usage, summary markup.
- Found: the explicit comment suggests awareness; the price is tracked but unused; nothing explains why.
- Conclusion: `(needs human input)`.
