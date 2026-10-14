---
sut_path: /Users/maaretp/Documents/cgi-code/two-versions/version1
commit: 4cc12c71000a270bc68718e13b1cf0850b102254
updated: 2026-10-14
external_references: []
---

# Evaluation Lens 2 — Coverage Balance

## Findings

1. **Gap: script errors are unobserved.** The SUT analysis notes inline `onclick` handlers referencing undefined globals before hydration, and the probe produced a `ReferenceError`. No property asserted on uncaught errors. *Suggested:* add `no-uncaught-script-errors` (Always over `pageerror`).
2. **Over-investment in pricing.** 8 of the initial 22 properties were price arithmetic; the highest-risk area by Antithesis fit (load-time timing) had 2. Re-balanced by priority changes rather than deletion, because the sub-checks are cheap once the umbrella model exists.
3. **Assertion-type balance.** Mostly `Always`; one liveness `Sometimes` (`page-becomes-interactive`); one cluster of `Sometimes` anchors. No `Reachable`, which is acceptable: no SUT-side instrumentation is planned, so there are no code-path markers to place. Recommend `Unreachable` for the "is not defined" error class (added under the gap-fill property).
4. **Lifecycle coverage.** Startup (hydration) ✓; navigation ✓; post-order ✓. No "shutdown" lifecycle exists for a page.
5. **Not covered, deliberately:** accessibility (quantity `tabindex="-1"`, missing `alt`, unlabeled "Contact Crystal" input, `aria-label="Submit"` overriding visible text) and content inconsistencies (header "dawn to dusk" vs footer "dusk to dawn"; 5-star review saying "4/5"). They are real findings for a tester, but they aren't Antithesis properties. Listed in synthesis for hand-off.

## Passes
- Every high-risk area in `sut-analysis.md` (state drift, input parsing, empty order, pricing, timers, assets) maps to at least one property.
