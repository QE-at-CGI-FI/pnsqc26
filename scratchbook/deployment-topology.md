---
sut_path: /Users/maaretp/Documents/cgi-code/two-versions/version1
commit: 4cc12c71000a270bc68718e13b1cf0850b102254
updated: 2026-10-14
external_references: []
---

# Deployment Topology — The Enchanted Brew Shop (version1)

## Summary

Two containers: a static web server for the SUT, and a client that runs headless Chromium driven by a Python/Playwright workload. No dependencies. Two containers, not one, is the minimum that lets Antithesis inject **network latency between the browser and the server**. That latency drives the highest-fit property (`early-interaction-not-lost`).

```text
+------------------------------+          HTTP (static files)        +---------------------------+
| brew-client                  | ----------------------------------> | brew-web                  |
| Python + Playwright +        | <---------------------------------- | nginx:alpine              |
| headless Chromium +          |   index.html, css, js, (png 404)    | serves version1/ as /     |
| Antithesis Python SDK        |                                     |                           |
| test template: /opt/antithesis/test/v1/brew/                       |                           |
+------------------------------+                                     +---------------------------+
```

## Components

### brew-web (service)
- **Image:** new `Dockerfile` — `FROM nginx:alpine`, `COPY version1/ /usr/share/nginx/html/` (exclude `antithesis/`).
- **Role:** service (the SUT is the static bundle; nginx is just its delivery mechanism).
- **Runs:** nginx on port 80.
- **Connections:** inbound from `brew-client` only.
- **Replicas:** 1. There is no server state, so more replicas add nothing.
- **Note:** Do not add artificial delays to nginx. Let Antithesis network faults create the latency.

### brew-client (client)
- **Image:** new `Dockerfile` based on `mcr.microsoft.com/playwright/python` (Chromium bundled) + `pip install antithesis` (Python SDK).
- **Role:** client / workload.
- **Entrypoint:** poll `http://brew-web/index.html` until it returns 200, emit `setup_complete` via the SDK, then `sleep infinity`.
- **External fonts:** The Antithesis environment has no internet. Every driver installs `page.route("**/fonts.googleapis.com/**", fulfill(empty text/css))` and `page.route("**/fonts.gstatic.com/**", abort)`. Otherwise render-blocking font CSS hangs first paint. This is an environment shim, not a SUT change.
- **Browser per command:** Each command launches its own browser context. Parallel sessions share no SUT state, so they only add CPU contention (which is still useful for timing).
- **Replicas:** 1.

## Test Template `/opt/antithesis/test/v1/brew/`

| Command | Purpose | Properties exercised |
|---|---|---|
| `parallel_driver_random_shopper.py` | Random action sequences (select/deselect, typed quantities incl. "", "-5", "0", "2.7", "150", +/- clicks, featured clicks with random waits around 2 s, fill and submit, close modal, multi-order sessions). After every action, check all `Always` oracles. | summary-reflects-dom-selection, displayed-total-matches-price-model (+ sub-checks), total-is-finite-nonnegative, quantity-within-bounds, order-requires-items, delivery-estimate-matches-selection, post-order-builder-state-coherent, featured-button-state-truthful, summary-line-items-account-for-total, money-rounding-consistent, order-numbers-unique, no-uncaught-script-errors, rich-order-states-reached |
| `parallel_driver_early_interaction.py` | `goto(wait_until="commit")`, act as soon as selectors exist, then wait for `load` and compare. | early-interaction-not-lost, no-uncaught-script-errors |
| `parallel_driver_navigation.py` | Make selections, navigate away, go back/forward, reload, compare. | restored-form-state-reflected |
| `eventually_page_interactive.py` | Fresh load after faults stop; wait for hydration marker ("3.00 gold"). | page-becomes-interactive |
| `eventually_assets_load.py` | Fresh load; record same-origin responses. | referenced-assets-load |
| `helper_model.py` | Label price model, DOM/model state readers, action vocabulary. | — |

Random choices use the Antithesis SDK random source (`antithesis.random`) so Antithesis can steer and replay them.

## SDK Selection

- **Workload:** Antithesis Python SDK. All assertions are emitted here.
- **SUT:** browser JavaScript; no SDK in the page. Page state is read via `page.evaluate("orderState")`; `orderState` is a global-lexical binding, so no SUT change is needed. Optional SUT markers would be `console.debug("ANTITHESIS:…")` lines relayed by the workload.
- Coverage instrumentation of the page's JS is not planned.

## Faults

| Fault | Relevance |
|---|---|
| Network latency / congestion / bad node (client↔web) | **Key**: widens the pre-hydration window; delays asset loads |
| CPU throttling / modulation (client) | Timer vs. click interleavings (featured button), event ordering |
| Node hang (web) | Long stalls mid-page-load → partial hydration timing |
| Node termination | Not needed |
| Clock jitter | Not relevant: the SUT doesn't read the clock; `setTimeout` uses monotonic timers |
| Thread pausing | Requires instrumentation; not planned |

## Assumptions

- Chromium is the only target browser.
- The Antithesis tenant has default network and CPU faults enabled. Node termination is not required.

## Open Questions

- Should a Firefox client be added? Firefox restores form state on reload, which widens `restored-form-state-reflected`. It would add a second browser image and more state space.
- Confirm the Python SDK package name, version and random API via `antithesis-documentation` (skill unavailable in this session).
