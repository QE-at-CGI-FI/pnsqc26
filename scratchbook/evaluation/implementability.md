---
sut_path: /Users/maaretp/Documents/cgi-code/two-versions/version1
commit: 4cc12c71000a270bc68718e13b1cf0850b102254
updated: 2026-10-14
external_references: []
---

# Evaluation Lens 3 — Implementability

## Findings

1. **Observation is cheap.** `orderState` is readable via `page.evaluate("orderState")` with no SUT change (top-level `let` in a classic script, global lexical scope). Verified in the probe.
2. **Clicking inputs directly fails.** Radio/checkbox inputs are covered by styled `.card-content` elements; Playwright `check()` timed out with "intercepts pointer events". The workload must click `label:has(input[value=…])`. Recorded in the topology/driver notes.
3. **External fonts must be stubbed.** No internet in Antithesis; render-blocking Google Fonts CSS would stall first paint. Stub via `page.route`. Already in the topology.
4. **`no-resubmit-while-confirmation-open` is not reachable.** Synchronous `form.reset()` plus `required` validation blocks the second submit (probe: one order number from a double-click). *Suggested:* invalidate.
5. **`restored-form-state-reflected` needs a navigation target.** Navigating to `index.html?x=1` and back works and needs no extra page.
6. **`early-interaction-not-lost` needs a "before load" fact.** The workload can record `document.readyState` at each action time (`page.evaluate` works before `load`) instead of a SUT marker.
7. **`featuredAdded` has no DOM projection.** `summary-reflects-dom-selection` can't compare it; the workload must track it from its own click log. Noted in evidence.

## Passes
- The topology supports every property's fault needs (client↔web network faults, CPU throttling). No property needs node termination or clock faults.
