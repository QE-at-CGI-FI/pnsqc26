# no-resubmit-while-confirmation-open — INVALIDATED

## Original hypothesis
Enter or a double-click while the confirmation is shown would submit again and replace the order number (a double-order).

## Investigation Log

#### Can a resubmit happen after the first submit?
- Examined: `handleFormSubmit` (`app.js:221-239`); `required` attributes (`index.html:239,248,258`); Playwright `dblclick` probe on "Brew My Order".
- Found: `form.reset()` runs synchronously in the submit handler, so the required fields are empty before the second click is processed. Native constraint validation then blocks the second submit. The probe recorded exactly one order number (`['EB-36555']`).
- Conclusion: not reachable in version1. Property **invalidated**. Revive it if reset becomes asynchronous or validation is removed.
