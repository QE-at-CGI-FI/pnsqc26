# post-order-builder-state-coherent

## Evidence trail
- `form.reset()` covers only `#order-form` (`index.html:235-296`): customer fields and delivery radio.
- Builder controls (`index.html:46-187`) sit outside the form and are untouched.
- `orderState.featuredAdded` is never cleared; the delivery model is stale (see `delivery-estimate-matches-selection`).

## Failure scenario
After the "Continue Shopping" button, the next order silently includes the previous potion, ingredients, quantity, and featured potion, while the delivery shown and the delivery used diverge.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
- What is the intended post-order behavior? (needs human input)

### Investigation Log

#### Intended post-order behavior?
- Examined: `handleFormSubmit`, `closeModal`, "Continue Shopping" label.
- Found: "Continue Shopping" could mean either keep or start fresh. The code resets only the form, which could be a half-implemented full reset.
- Conclusion: `(needs human input)`. The invariant accepts either consistent outcome.
