---
sut_path: /Users/maaretp/Documents/cgi-code/two-versions/version1
commit: 4cc12c71000a270bc68718e13b1cf0850b102254
updated: 2026-10-14
external_references: []
---

# Existing Antithesis Assertions

## Summary

**No existing instrumentation.** The SUT (`index.html`, `css/style.css`, `js/app.js`) contains no Antithesis SDK imports and no assertion calls of any kind (`Always`, `Sometimes`, `Reachable`, `Unreachable`, `AlwaysOrUnreachable`, or language macros), nor any generic `console.assert` / test hooks.

## Scan Method

- `grep -rn "antithesis\|assert"` over `version1/` (excluding this scratchbook) — zero hits.
- Manual read of all three source files (377 + 259 + 1062 lines).

## Assumptions

- The SUT is browser JavaScript. There is no Antithesis SDK loaded in the page, so every assertion recommended in this scratchbook is either (a) emitted by the workload (Python + Playwright + Antithesis Python SDK) after reading page state, or (b) a proposed SUT-side marker relayed via `console` messages that the workload converts into SDK calls.

## Open Questions

- None.
