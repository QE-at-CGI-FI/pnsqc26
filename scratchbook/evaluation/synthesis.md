---
sut_path: /Users/maaretp/Documents/cgi-code/two-versions/version1
commit: 4cc12c71000a270bc68718e13b1cf0850b102254
updated: 2026-10-14
external_references: []
---

# Evaluation Synthesis

Single-agent mode; lens evidence in `antithesis-fit.md`, `coverage-balance.md`, `implementability.md`, `wildcard.md`.

## Refinements (applied)

| # | Finding | Action taken |
|---|---|---|
| R1 | Deterministic pricing properties over-prioritized (Fit 1, Coverage 2) | `size-multiplier-matches-label`, `ingredient-charge-matches-label`, `featured-charge-matches-sale-price`, `ingredients-scale-with-quantity`, `money-rounding-consistent`, `referenced-assets-load` set to P3; `total-includes-delivery` P2; recorded as sub-checks of `displayed-total-matches-price-model` |
| R2 | `early-interaction-not-lost` under-prioritized (Fit 2) | Raised to P1 |
| R3 | `restored-form-state-reflected` reachable in Chromium via back-navigation (Fit 3, Impl 5) | Raised to P2; open question resolved with investigation log |
| R4 | `no-resubmit-while-confirmation-open` unreachable (Impl 4) | Invalidated with reason in catalog and evidence file |
| R5 | Inputs not directly clickable (Impl 2); fonts need stub (Impl 3) | Recorded in `deployment-topology.md` driver notes |
| R6 | `featuredAdded` not observable in DOM (Impl 7) | Noted in `summary-reflects-dom-selection` evidence and open question |

## Gaps (filled)

| # | Gap | Action taken |
|---|---|---|
| G1 | No property on uncaught script errors, despite confirmed `ReferenceError` (Coverage 1) | Added `no-uncaught-script-errors` (P1) with evidence file and relationships entry. One property in an existing category, so no re-evaluation pass is needed. |

## Biases (escalated to human)

| # | Bias | Evidence | Judgment needed |
|---|---|---|---|
| B1 | **Tool fit.** The catalog is necessarily oriented toward UI-logic defects that cheaper tools already find. Only ~4 properties (`early-interaction-not-lost`, `no-uncaught-script-errors`, `restored-form-state-reflected`, `featured-button-state-truthful`) depend on timing Antithesis controls. | Wildcard 1, Fit 1. A 60-line Playwright probe confirmed 8 defects in seconds. | Proceed with Antithesis for the timing cluster and random-session exploration, or use Playwright + property-based tests and reserve Antithesis for systems with server state? |
| B2 | **Spec source.** Seven properties assume visible labels define correct prices. | Wildcard 2; `displayed-total-matches-price-model` investigation log. | Which is authoritative: labels, `data-*`, or JS constants? Also: delivery in total? ingredients per potion? fractional gold? |
| B3 | **Single-version framing.** The repo holds two versions; a differential oracle could be the strongest Antithesis use. | Wildcard 3. Scope answer was "Just this directory". | Extend scope to version2 for a differential workload? |

## Out-of-scope findings handed off (not Antithesis properties)

- Accessibility: `#quantity` has `tabindex="-1"` (`index.html:184`); the featured `<img>` has no `alt` (`:31`); the "Contact Crystal" input has no label (`:243`); `aria-label="Submit"` overrides the visible "Brew My Order" (`:292`).
- Content: header "Open dawn to dusk" (`:21`) vs footer "Open dusk to dawn" (`:344`); a review with 5 filled stars says "4/5" (`:322-323`; rendered with `.light-stars`); footer heading levels mixed `h5`/`h4`; dead link `wandergram.fake`.
