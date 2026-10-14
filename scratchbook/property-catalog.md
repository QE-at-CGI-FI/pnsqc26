---
sut_path: /Users/maaretp/Documents/cgi-code/two-versions/version1
commit: 4cc12c71000a270bc68718e13b1cf0850b102254
updated: 2026-10-14
external_references: []
---

# Property Catalog — The Enchanted Brew Shop (version1)

## Summary

22 active properties (plus 1 invalidated) across 6 categories. Discovery ran in single-agent mode over 11 focuses; evaluation (4 lenses) then re-prioritized the catalog toward timing and sequence exploration and added one gap-fill property (`no-uncaught-script-errors`). See `evaluation/synthesis.md`.

**Observation model.** All assertions are emitted by the workload (Python + Playwright + Antithesis Python SDK). The workload reads page state through the DOM and through `page.evaluate("orderState")` — `orderState` is a top-level `let` in a classic script, so it's reachable from the page's main world with **no SUT change**. Optional SUT-side markers (`console.debug("ANTITHESIS:<event>")` relayed by the workload) are noted where they would give better search guidance. **No assertions currently exist** (`existing-assertions.md`).

**Price model ("label model").** Where an Invariant refers to the *label model*, it means: price computed only from visible UI text — base price label × size label multiplier × potency label multiplier × quantity + Σ ingredient labels + 34 per featured potion + brewing fee 3 (+ delivery label if `total-includes-delivery` is confirmed). Whether labels are the right spec is an open human decision (see synthesis, Bias B2).

**Probe confirmation.** Several invariants below were exercised once in headless Chromium on 2026-10-14 (probe script described in each evidence file); results are recorded as evidence, and each property still describes what to test, not a settled verdict.

### Priority Overview

| Priority | Slugs |
|---|---|
| P1 | `early-interaction-not-lost`, `no-uncaught-script-errors`, `summary-reflects-dom-selection`, `delivery-estimate-matches-selection`, `displayed-total-matches-price-model`, `total-is-finite-nonnegative`, `quantity-within-bounds`, `order-requires-items` |
| P2 | `restored-form-state-reflected`, `page-becomes-interactive`, `summary-line-items-account-for-total`, `total-includes-delivery`, `post-order-builder-state-coherent`, `featured-button-state-truthful`, `rich-order-states-reached` |
| P3 | `size-multiplier-matches-label`, `ingredient-charge-matches-label`, `featured-charge-matches-sale-price`, `ingredients-scale-with-quantity`, `money-rounding-consistent`, `order-numbers-unique`, `referenced-assets-load` |

### Properties needing human input

- `total-includes-delivery` — is delivery meant to be in the total?
- `ingredients-scale-with-quantity` — are ingredients per potion or per order?
- `post-order-builder-state-coherent` — what should the builder look like after an order?
- `displayed-total-matches-price-model` (and the three P3 label properties) — are labels the spec?

---

## Category 1 — Load-time Timing and DOM↔Model Consistency

The model (`orderState`) is updated only by events and never reconciled with the DOM. Any skipped event (late script, `form.reset()`, browser restoration) causes silent divergence between what the shopper sees and what is priced and promised. This is where Antithesis's network latency and interleaving exploration adds the most value.

### early-interaction-not-lost — Selections Made Before Script Load Are Honored

| | |
|---|---|
| **Type** | Safety |
| **Property** | Every builder selection visible in the DOM after `app.js` finishes loading is reflected in `orderState` and the summary, even if the user made it while the script was still downloading. |
| **Invariant** | Workload driver navigates with `wait_until="commit"`, interacts as soon as controls exist, then waits for `load`; `Always(model == f(checked DOM controls), "early-interaction: model matches DOM after hydration")`. `Always` because divergence is never acceptable once the page is live. Add `Sometimes(interaction_happened_before_load, "early-interaction: user acted before app.js loaded")` so the run proves the dangerous window was actually explored, rather than passing vacuously. |
| **Antithesis Angle** | Network latency/congestion between `brew-client` and `brew-web` stretches the window between first paint and `app.js` execution. Antithesis explores which interactions land inside that window. |
| **Why It Matters** | A shopper on a slow connection picks a potion, sees it highlighted, and gets charged 3 gold for nothing (probe: DOM shows Strength checked, `orderState.basePotion == null`, total "3.00 gold"). |

**Open Questions:**

- Should the fix be to read the DOM at init, or to defer/block interaction? This affects only remediation, not the invariant.

### no-uncaught-script-errors — The Page Never Throws Uncaught Errors

| | |
|---|---|
| **Type** | Safety |
| **Property** | No uncaught JavaScript exception occurs during any session. |
| **Invariant** | Workload collects Playwright `pageerror` events; `Always(len(page_errors) == 0, "no-uncaught-script-errors")` checked after every action. `Always` because any uncaught error is a defect. A distinct `Unreachable("inline handler called before definition")` when the message matches `/is not defined/` gives Antithesis a sharper target. |
| **Antithesis Angle** | Inline `onclick` handlers (`changeQuantity`, `addFeaturedToOrder`, `closeModal`) exist in the DOM before `app.js` defines them; latency decides whether a click hits that window. |
| **Why It Matters** | Probe reproduced `ReferenceError: changeQuantity is not defined` by clicking "+" during a slow script load. The click is silently lost. |

**Open Questions:**

- None

### summary-reflects-dom-selection — Summary Always Matches the Visible Selection

| | |
|---|---|
| **Type** | Safety |
| **Property** | After any settled user action, the order summary text and `orderState` agree with the currently checked/entered DOM controls. |
| **Invariant** | After each workload action: `Always(state_from_dom() == state_from_model(), "summary matches DOM selection")` comparing potion, size, potency, ingredient set, quantity, delivery method, and featured flag. This is the core oracle; it dominates several narrower properties (see `property-relationships.md`). |
| **Antithesis Angle** | Random action sequences (select, deselect, reset via submit, reload, rapid toggles) explore the combinatorial space for any path that skips an event. |
| **Why It Matters** | Divergence means the shopper is quoted/promised something other than what they selected. |

**Open Questions:**

- Should `featuredAdded` be represented in the DOM at all? There is no visible indicator after the 2 s feedback ends, so the DOM side of this comparison can't see it. See `featured-button-state-truthful`.

### delivery-estimate-matches-selection — Confirmation Promises the Delivery Method Shown

| | |
|---|---|
| **Type** | Safety |
| **Property** | The delivery estimate in the confirmation modal corresponds to the delivery radio that was checked when the order was submitted. |
| **Invariant** | Workload records the checked delivery radio immediately before submit, then `Always(estimate == {"owl":"3-5 days","dragon":"Tomorrow"}[checked], "confirmation delivery estimate matches selected delivery")`. |
| **Antithesis Angle** | Sequence-dependent: requires dragon → submit → (form reset) → submit again without touching delivery. Random exploration finds it; a scripted happy-path test does not. |
| **Why It Matters** | Probe: second order with Owl Post shown selected was confirmed as "Tomorrow" because `form.reset()` (`app.js:238`) does not fire `change`. A false delivery promise. |

**Open Questions:**

- None

### restored-form-state-reflected — Browser-Restored Form State Is Reflected After Navigation

| | |
|---|---|
| **Type** | Safety |
| **Property** | After reload or back/forward navigation, any form state the browser restores is reflected in the summary. |
| **Invariant** | Driver performs selections, then `reload()` or `go_back()/go_forward()`; `Always(state_from_dom() == state_from_model(), "summary matches DOM after reload/back-forward")`. Pair with `Sometimes(dom_differs_from_defaults_after_navigation, "browser restored non-default form state")` so a vacuous pass (no restoration in Chromium) is visible. |
| **Antithesis Angle** | Navigation lifecycle combined with load timing; bfcache vs. full reload paths. |
| **Why It Matters** | `orderState` initializes from hard-coded defaults, not the DOM (`app.js:34-47`). Probe in headless Chromium: after navigating away and back, Wisdom was checked in the DOM while `orderState.basePotion == null`. Reload did not restore state. |

**Open Questions:**

- Are browsers other than Chromium in scope? Firefox also restores on reload, which would widen the trigger.

### page-becomes-interactive — Page Eventually Becomes Fully Interactive

| | |
|---|---|
| **Type** | Liveness |
| **Property** | After faults stop, a fresh page load reaches a state where listeners are attached and the summary is rendered by JS. |
| **Invariant** | In an `eventually_` command: load page, poll until `typeof updateOrderSummary === 'function'` and total text matches `/^\d+\.\d{2} gold$/` (JS-formatted; the static HTML says "3 gold"). `Sometimes(hydrated, "page becomes interactive after faults stop")`. `Sometimes` because this is progress, not a per-evaluation invariant. |
| **Antithesis Angle** | Requires a quiet period; verifies that render-blocking external font CSS (stubbed in the topology) and asset faults don't wedge the page. |
| **Why It Matters** | Baseline liveness; also guards the workload against vacuous passes when the page never loads. |

**Open Questions:**

- None

---

## Category 2 — Price Model Correctness

### displayed-total-matches-price-model — Displayed Total Equals the Label Model

| | |
|---|---|
| **Type** | Safety |
| **Property** | After any settled action, the displayed total equals the price computed from the visible labels. |
| **Invariant** | Workload keeps an independent label model; `Always(abs(displayed_total - label_model_total) < 0.005, "displayed total matches label price model")`. Umbrella oracle for random sessions; the P3 label properties below are its diagnosable sub-checks with distinct messages. |
| **Antithesis Angle** | Explores the full option space (4 potions × 3 sizes × 3 potencies × 2⁶ ingredients × quantities × featured × delivery) along with action ordering. Its value over a unit test is breadth and replay, not faults. |
| **Why It Matters** | Price shown ≠ price advertised is the most user-visible defect class. Probe: Healing + Flask = 36.75 shown vs 40.50 label model. |

**Open Questions:**

- Are visible labels the spec, or are JS constants/`data-*` attributes? `(needs human input)`

### size-multiplier-matches-label — Size Pricing Matches Advertised Multiplier

| | |
|---|---|
| **Type** | Safety |
| **Property** | Selecting a size multiplies the potion price by the multiplier shown on that size option. |
| **Invariant** | `Always(model.sizeMultiplier == label_multiplier(size), "size multiplier matches label")`. Flask label 1.5 vs code 1.35 (`app.js:10`, `data-multiplier="1.5"` ignored); Bottle label "2x" (`index.html:114`) vs summary "2.5x" and code 2.5. |
| **Antithesis Angle** | Weak — deterministic. Kept as a precise sub-check; best covered by a unit test too. |
| **Why It Matters** | Every Flask order is under-charged 10%; Bottle is labeled inconsistently. |

**Open Questions:**

- Is Bottle meant to be 2x or 2.5x? The page states both. `(needs human input)`

### ingredient-charge-matches-label — Ingredient Charges Match Labels

| | |
|---|---|
| **Type** | Safety |
| **Property** | Each checked ingredient adds exactly its labeled price. |
| **Invariant** | `Always(model.ingredientsTotal == Σ label_price(checked), "ingredient charges match labels")`. Phoenix Feather label +20 / `data-price` 18; Starlight Dew +12 / 10. |
| **Antithesis Angle** | Weak — deterministic. |
| **Why It Matters** | Probe: Healing + Phoenix = 46.00 vs 48.00 label model. |

**Open Questions:**

- None

### featured-charge-matches-sale-price — Featured Potion Charged at Sale Price

| | |
|---|---|
| **Type** | Safety |
| **Property** | Adding the featured potion adds the advertised 34 gold (15% off 40). |
| **Invariant** | `Always(delta_total_on_featured_add == 34, "featured potion charged at sale price")`. Code hard-codes 36 (`app.js:189`). |
| **Antithesis Angle** | Weak — deterministic. |
| **Why It Matters** | Probe: Healing + featured = 64.00 vs 62.00. Advertised discount not honored. |

**Open Questions:**

- None

### total-includes-delivery — Total Includes Delivery Charge

| | |
|---|---|
| **Type** | Safety |
| **Property** | The total includes the selected delivery method's charge. |
| **Invariant** | `Always(displayed_total == subtotal + 3 + delivery_label_price, "total includes delivery charge")`. Currently never true: `app.js:199-200` adds only the brewing fee, with the comment "delivery not included". |
| **Antithesis Angle** | Weak alone; interacts with `delivery-estimate-matches-selection` because `orderState.deliveryPrice` also goes stale after reset. If delivery is ever added, the stale price becomes a charging bug. |
| **Why It Matters** | Shopper picks Dragon Express (15 gold) and the total doesn't change. Delivery cost isn't shown anywhere in the summary. |

**Open Questions:**

- Is excluding delivery intentional (charged later) or a defect? The code comment suggests a deliberate choice. `(needs human input)`

### ingredients-scale-with-quantity — Ingredients Priced Per Potion

| | |
|---|---|
| **Type** | Safety |
| **Property** | Ingredient cost is consistent with the quantity semantics the product intends. |
| **Invariant** | If per-potion: `Always(subtotal == (potion + ingredients) × qty + featured, "ingredients scale with quantity")`. Code: `potion × qty + ingredients + featured` (`app.js:193`). |
| **Antithesis Angle** | Weak. |
| **Why It Matters** | 10 potions with Dragon Scale charged 15 gold total, not 150. |

**Open Questions:**

- Are ingredients per potion or per order? `(needs human input)`

### summary-line-items-account-for-total — Summary Lines Explain the Total

| | |
|---|---|
| **Type** | Safety |
| **Property** | Every amount contributing to the subtotal is shown as a line item, and the shown line items sum to the subtotal. |
| **Invariant** | `Always(abs(Σ visible line amounts - displayed_subtotal) < 0.005, "summary line items sum to subtotal")`. Today the potion line shows the unmultiplied base price, size/potency/quantity lines show "-", and the featured potion has no line at all. |
| **Antithesis Angle** | Moderate: featured + quantity + multipliers combinations. |
| **Why It Matters** | Shoppers can't reconcile the total; featured charge is invisible after the button resets. |

**Open Questions:**

- None

### money-rounding-consistent — Monetary Amounts Rounded Consistently

| | |
|---|---|
| **Type** | Safety |
| **Property** | Displayed amounts use one rounding rule and the total equals the rounded sum of its parts. |
| **Invariant** | `Always(displayed_total == round2(displayed_subtotal) + 3, "money rounding consistent")`, plus format check: all amounts match `^\d+\.\d{2} gold$` after hydration (static HTML shows "0 gold"/"3 gold"). Fractional gold is reachable, e.g. 25 × 1.35 × 1.25 = 42.1875. |
| **Antithesis Angle** | Weak. |
| **Why It Matters** | Low; cosmetic/rounding. |

**Open Questions:**

- Is fractional gold intended at all? `(needs human input)`

---

## Category 3 — Input Boundaries

### total-is-finite-nonnegative — Total Is a Finite, Non-negative Amount

| | |
|---|---|
| **Type** | Safety |
| **Property** | The displayed total always parses as a finite number ≥ the brewing fee. |
| **Invariant** | `Always(isfinite(t) and t >= 3, "total is finite and non-negative")` after every action. |
| **Antithesis Angle** | Reached via action sequences on the quantity control: clear the field then "+" (→ NaN); type "-5" (→ negative). The workload must be allowed to type arbitrary strings, not just click the buttons. |
| **Why It Matters** | Probe: "NaN gold" and "-122.00 gold" both reproduced. |

**Open Questions:**

- None

### quantity-within-bounds — Quantity Is an Integer in 1..99 and Matches the Field

| | |
|---|---|
| **Type** | Safety |
| **Property** | `orderState.quantity` is always an integer in [1, 99] and equals the value shown in the quantity field. |
| **Invariant** | `Always(isinstance(q,int) and 1 <= q <= 99, "quantity within bounds")`; `Always(q == int(field_value), "quantity model matches field")` as a separate message. Typed input is unclamped (`app.js:132`); `0` → model 1 but field shows 0; `""` + "+" → NaN (`app.js:145-149`). |
| **Antithesis Angle** | Interleaving `input`/`change` events with button clicks; typed decimals ("2.7" → 2). |
| **Why It Matters** | Root cause for `total-is-finite-nonnegative`; also a model/DOM divergence. |

**Open Questions:**

- None

---

## Category 4 — Order Submission

### order-requires-items — No Confirmation for an Empty Order

| | |
|---|---|
| **Type** | Safety |
| **Property** | A confirmation (order number) is never shown unless the order contains at least one potion (base or featured). |
| **Invariant** | On modal becoming active: `Always(model.basePotion is not None or model.featuredAdded, "confirmed order contains at least one potion")`. `Always` rather than `Unreachable` because it's a conditional check at a specific moment. |
| **Antithesis Angle** | Sequence-dependent: also covers "select potion → submit → submit again" (builder untouched, so not empty), and reaching submit before hydration. |
| **Why It Matters** | Probe: order confirmed with nothing selected and a 3-gold total. |

**Open Questions:**

- Is a featured-only order valid? Assumed yes.

### post-order-builder-state-coherent — Builder State After an Order Is Coherent

| | |
|---|---|
| **Type** | Safety |
| **Property** | After a confirmed order, the builder is either fully reset or fully retained, never partly. |
| **Invariant** | After closing the modal: `Always(all_reset or all_retained, "post-order builder state coherent")` over {builder DOM, featuredAdded, delivery DOM, delivery model}. Today: customer fields and the delivery radio are reset; the builder, `featuredAdded`, and the delivery model are retained. |
| **Antithesis Angle** | Multi-order sessions. |
| **Why It Matters** | The next order silently includes the previous featured potion and selections. |

**Open Questions:**

- What is the intended post-order behavior? `(needs human input)`

### order-numbers-unique — Order Numbers Are Unique Within a Session

| | |
|---|---|
| **Type** | Safety |
| **Property** | No two confirmations in a session share an order number. |
| **Invariant** | Workload keeps a set; `Always(num not in seen, "order numbers unique")`. Space is 90 000 values from `Math.random()` (`app.js:226`). |
| **Antithesis Angle** | Antithesis controls the random source, so collisions are explorable rather than astronomically rare. |
| **Why It Matters** | Low for a demo page; real systems need server-issued IDs. |

**Open Questions:**

- None

---

## Category 5 — Timers

### featured-button-state-truthful — Featured Button State Reflects What Clicking Does

| | |
|---|---|
| **Type** | Safety |
| **Property** | When the featured button is enabled and labeled "Add to Order", clicking it changes the order. Otherwise it shows that the potion is already added. |
| **Invariant** | On each click of an enabled button: `Always(total_after != total_before, "enabled featured button adds to order")`. After 2 s the button re-enables (`app.js:216-219`), but `featuredAdded` is a boolean, so further clicks are silent no-ops. |
| **Antithesis Angle** | Timer/click interleaving; CPU throttling shifts when the 2 s timeout fires relative to clicks. |
| **Why It Matters** | The shopper believes they added two; the order has one, and nothing in the summary shows the featured item. |

**Open Questions:**

- Should repeat adds increment a count, or should the button stay in an "added" state? Either satisfies the invariant if the label stays truthful.

---

## Category 6 — Reachability Anchors and Environment

### rich-order-states-reached — Exploration Reaches Interesting Order States

| | |
|---|---|
| **Type** | Reachability |
| **Property** | The workload drives the page into non-trivial states that the safety properties need. |
| **Invariant** | Distinct `Sometimes` anchors, each with its own message: `Sometimes(confirmed with dragon delivery)`, `Sometimes(confirmed with qty ≥ 10 and ≥ 3 ingredients)`, `Sometimes(featured added and base potion selected)`, `Sometimes(second order in same session confirmed)`, `Sometimes(quantity field empty or non-numeric at action time)`. These are meaningful semantic states, not line coverage, so `Sometimes(cond)` fits better than `Reachable`. |
| **Antithesis Angle** | Guides exploration and gives replay anchors for the sequence-dependent safety properties. |
| **Why It Matters** | Without these, sequence-dependent properties can pass vacuously. |

**Open Questions:**

- None

### referenced-assets-load — All Referenced Assets Load

| | |
|---|---|
| **Type** | Safety |
| **Property** | With faults paused, every same-origin asset the page references returns 2xx. |
| **Invariant** | In an `eventually_` command: `Always(all(resp.ok for same-origin responses), "referenced assets load")`. `images/featured-potion.png` is referenced (`index.html:31`) but absent from the repo. |
| **Antithesis Angle** | None under faults (deterministic); kept as an environment sanity check. |
| **Why It Matters** | Broken featured image (and it has no `alt`). |

**Open Questions:**

- None

---

## Invalidated Properties

### no-resubmit-while-confirmation-open — No Second Order While Confirmation Is Shown — INVALIDATED

**Reason:** not reachable in version1. `handleFormSubmit` calls `form.reset()` synchronously in the same task (`app.js:238`), which empties the `required` customer fields. Any second submit (double-click, Enter) is blocked by native constraint validation. A Playwright double-click probe produced exactly one order number. Revive this property if reset becomes async or validation is removed (e.g. in version2). Evidence: `properties/no-resubmit-while-confirmation-open.md`.

## Assumptions

- Chromium via Playwright is the only browser in the topology.
- Visible labels define expected prices unless a human decides otherwise.
- A featured-only order is a valid order.

## Open Questions

- Catalog-wide: is it worth running this SUT on Antithesis at all, versus a Playwright suite plus a property-based UI fuzzer? See `evaluation/synthesis.md` Bias B1. `(needs human input)`
- Catalog-wide: confirm whether an Antithesis JavaScript SDK exists for in-page assertions. The `antithesis-documentation` skill was not available in this session.
