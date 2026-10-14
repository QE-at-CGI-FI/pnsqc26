# page-becomes-interactive

## Evidence trail
- Render-blocking resources: `css/style.css`, `fonts.googleapis.com/css2?...` (`index.html:7-10`). The Antithesis environment has no internet, so the font request would hang or fail unless stubbed.
- Hydration signal: the static HTML total reads "3 gold"; after `updateOrderSummary()` it reads "3.00 gold" (`toFixed(2)`, `app.js:203`). That difference is a free, SUT-unchanged hydration marker.

## Instrumentation
**Instrumentation status** (cross-checked with `existing-assertions.md`): no Antithesis assertions exist anywhere in the SUT, so every assertion below is **missing**.
- Workload (`eventually_page_interactive`): `Sometimes(hydrated, "page becomes interactive after faults stop")` — missing.

## Open questions
None.
