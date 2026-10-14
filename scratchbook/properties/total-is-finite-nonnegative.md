# total-is-finite-nonnegative

## Evidence trail
- `handleQuantityChange`: `parseInt(value) || 1` (`app.js:132`). Negative values are truthy, so they pass through.
- `changeQuantity`: `parseInt(input.value) + delta` (`app.js:145`). With an empty field this is `NaN`, both clamp comparisons are false, and `input.value = NaN` and `orderState.quantity = NaN` are set.

## Probe result
Probe: Python Playwright 1.x, headless Chromium, local static server, Google Fonts stubbed via `page.route`, run 2026-10-14 (`scratchpad/probe.py`, `probe2.py`; not committed).
- Empty field, then "+": "Quantity: NaN", total "NaN gold".
- Healing, typed "-5": total "-122.00 gold" (25 × −5 + 3).

## Workload note
The quantity input has `tabindex="-1"` but is mouse-focusable; the workload must use `fill()` with arbitrary strings ("", "-5", "0", "2.7", "1e3", "abc") to reach these states.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.

## Open questions
None.
