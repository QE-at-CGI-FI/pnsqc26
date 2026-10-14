# featured-button-state-truthful

## Evidence trail
- `addFeaturedToOrder` sets `featuredAdded = true` (boolean), shows "✓ Added!", disables the button, then re-enables "Add to Order" after 2000 ms (`app.js:207-220`).
- Second and later clicks set the same boolean, so the total doesn't change while the button invites a further add.
- No summary line shows the featured item (see `summary-line-items-account-for-total`).

## Antithesis angle
CPU throttling and thread pausing shift when the timeout fires relative to rapid clicks. A disabled button ignores clicks, so the interesting interleavings are clicks right around the re-enable.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
- Should repeat adds increment a count, or should the button stay "added"? Either satisfies the invariant if the label stays truthful.
