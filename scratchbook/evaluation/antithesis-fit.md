---
sut_path: /Users/maaretp/Documents/cgi-code/two-versions/version1
commit: 4cc12c71000a270bc68718e13b1cf0850b102254
updated: 2026-10-14
external_references: []
---

# Evaluation Lens 1 — Antithesis Fit

Single-agent pass over the catalog as first drafted (before refinements).

## Findings

1. **Catalog-wide: most pricing properties are unit-test territory.** `size-multiplier-matches-label`, `ingredient-charge-matches-label`, `featured-charge-matches-sale-price`, `total-includes-delivery`, `ingredients-scale-with-quantity`, `money-rounding-consistent`, `referenced-assets-load` are deterministic: one fixed input exposes each. In the first draft four of them were P1/P2. *Suggested:* drop to P3, keep as distinct sub-messages under the umbrella oracle, and recommend a plain unit/Playwright test for each.
2. **Underestimated: `early-interaction-not-lost`.** First draft had it P2. It is the one property that depends purely on injected network timing, and the only one where Antithesis does something a normal test suite won't. *Suggested:* P1.
3. **Underestimated: `restored-form-state-reflected`.** Initially P3 and possibly vacuous; probing showed a back-navigation divergence in Chromium. Navigation × load timing is a good fit. *Suggested:* P2.
4. **`order-numbers-unique` fits better than it looks.** Controlled randomness makes collisions explorable. Product value is low, though. Keep P3.
5. **Assertion types.** `page-becomes-interactive` correctly uses `Sometimes` (liveness, in `eventually_`). `rich-order-states-reached` correctly uses `Sometimes(cond)` with semantic conditions rather than `Reachable`. `order-requires-items` correctly uses `Always` conditioned on the modal-open moment rather than `Unreachable`.

## Passes
- Sequence-dependent properties (`delivery-estimate-matches-selection`, `total-is-finite-nonnegative`) benefit from guided random exploration — reasonable fit.

## Uncertainties
- How much value CPU throttling adds for `featured-button-state-truthful`: the bug reproduces with no timing pressure at all (click again after 2 s).
