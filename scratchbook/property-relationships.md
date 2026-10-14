---
sut_path: /Users/maaretp/Documents/cgi-code/two-versions/version1
commit: 4cc12c71000a270bc68718e13b1cf0850b102254
updated: 2026-10-14
external_references: []
---

# Property Relationships

## Event-skip divergence (model never reconciled with DOM)
Properties: summary-reflects-dom-selection, early-interaction-not-lost, restored-form-state-reflected, delivery-estimate-matches-selection, quantity-within-bounds
Notes: Same root mechanism: `orderState` changes only on events and initializes from constants (`app.js:34-47`). Each narrower property is one way an event gets skipped (no listener yet, browser restoration, `form.reset()`, programmatic value set). Suspected dominance: `summary-reflects-dom-selection` implies the others when checked at the right moments. Keep the narrow ones for distinct messages and targeted drivers.

## Load-time race
Properties: early-interaction-not-lost, no-uncaught-script-errors, page-becomes-interactive
Notes: All three depend on the gap between first paint and `app.js` execution. Inline `onclick` handlers throw in that gap (no-uncaught), and change listeners miss events (early-interaction). page-becomes-interactive is the liveness side: the gap must eventually close.

## Label price model
Properties: displayed-total-matches-price-model, size-multiplier-matches-label, ingredient-charge-matches-label, featured-charge-matches-sale-price, total-includes-delivery, ingredients-scale-with-quantity, money-rounding-consistent
Notes: The umbrella oracle dominates the label sub-checks. All hinge on the same human decision (labels as spec; Bias B2). total-includes-delivery and ingredients-scale-with-quantity change the model formula itself.

## Delivery state
Properties: delivery-estimate-matches-selection, total-includes-delivery, post-order-builder-state-coherent
Notes: All three involve `orderState.deliveryMethod/deliveryPrice` going stale after `form.reset()`. If delivery is ever priced, the stale-estimate bug becomes a stale-charge bug.

## Quantity input
Properties: quantity-within-bounds, total-is-finite-nonnegative
Notes: quantity-within-bounds is the root cause; total-is-finite-nonnegative is the user-visible consequence. Suspected dominance: bounds → finiteness (given non-negative prices).

## Featured potion visibility
Properties: featured-button-state-truthful, featured-charge-matches-sale-price, summary-line-items-account-for-total, post-order-builder-state-coherent
Notes: `featuredAdded` is a hidden boolean: it is charged at the wrong price, has no summary line, survives across orders, and the button falsely invites repeat adds.

## Order submission
Properties: order-requires-items, order-numbers-unique, post-order-builder-state-coherent, rich-order-states-reached
Notes: rich-order-states-reached supplies the `Sometimes` anchors (second order, dragon delivery) that keep the sequence-dependent submission properties from passing vacuously.

## Standalone
Properties: referenced-assets-load
Notes: Environment sanity check (missing `images/featured-potion.png`). Shares no mechanism with other properties. The invalidated `no-resubmit-while-confirmation-open` is intentionally not clustered.
