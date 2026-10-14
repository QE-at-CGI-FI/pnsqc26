---
sut_path: /Users/maaretp/Documents/cgi-code/two-versions/version1
commit: 4cc12c71000a270bc68718e13b1cf0850b102254
updated: 2026-10-14
external_references: []
---

# Evaluation Lens 4 — Wildcard

Other lenses: (1) Antithesis Fit — sweet spot vs. unit-test territory; (2) Coverage Balance — portfolio vs. risk areas; (3) Implementability — observability and topology feasibility.

## Findings

1. **Question the frame: is Antithesis the right tool at all?** The SUT is a seeded-defect teaching page with no backend. Most findings were already confirmed by a ~60-line Playwright probe in seconds. Antithesis adds unique value mainly in the load-time race and navigation timing, and to a lesser degree in long random sessions. This is a judgment call for the human (Bias B1).
2. **The spec is undecided (Bias B2).** Seven properties use "labels are the spec". If the owner says the JS constants are authoritative, four properties flip from "failing" to "label text defect" and the oracle changes.
3. **Two versions exist.** The repo is `two-versions/`; version1 is likely meant to be compared with a version2. A differential oracle (same action sequence against both versions, compare totals, estimates, and errors) may be the most Antithesis-friendly framing: one workload, two `brew-web` containers. Not added as a property, because version2 was explicitly out of scope ("Just this directory"). Flagged for the human.
4. **Cross-cut: the hidden featured boolean.** It is charged at the wrong price, missing from the summary, persists across orders, and the button falsely re-invites. Four properties touch it; nobody owns "the shopper can see what they're paying for". `summary-line-items-account-for-total` covers this partially. Acceptable.
5. **Odd: `tabindex="-1"` on the only free-text numeric input.** It looks like an attempt to steer users to the +/- buttons; the unclamped typed path stays mouse-reachable. Doesn't change any property, but explains why the bug survives a keyboard-only exploratory pass.
