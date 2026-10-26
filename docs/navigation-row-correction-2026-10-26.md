# Navigation Row Correction

## Boundary

Target: published paywall builder. Two user-reported issues only: the wrong parent component for navigation buttons, and the missing Blue-template back button. Allowed surfaces: navigation composition, overlay alignment, Blue defaults, conservative legacy repair and affected tests. No changes to SKU, legal copy, template media, popup ownership or proxy settings.

Existing GitHub remote and Vercel host remain the authorized release destinations under the user's explicit published-Demo correction request. Commit/push/deploy/runtime verification are one delivery; rollback is a follow-up source commit, not an overwrite of saved browser records.

## Source and Decisions

- The user screenshot shows Screen > Header row > Button > Icon. Existing observed inventory classifies Header row as Stack.
- Current reference webpage inspected read-only: RevenueCat draft wf93b803836a034296. Selecting Header row exposes layer-stack ID, overlay axis, top-right alignment, Fill width and Fit height. No source content changed or published.
- Official Header documentation distinguishes a fixed Header from an ordinary Stack: https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/components#header
- Keep genuine user-created fixed Headers supported. Correct only the previous generated-navigation Header fingerprint, preserving IDs, icon/action edits and nested popup content.

## Issue Ledger

1. NAV-01: generated navigation buttons incorrectly use fixed Header. Replace with ordinary Stack, overlay alignment and Button > Icon children; expose the observed nine-position overlay alignment control.
2. NAV-02: Blue template lacks a default back control. Add editable Back Button > Icon inside an overlay navigation Stack at the hero's upper left, without pushing content down. Repair an old missing default only once; do not restore a user-deleted control or duplicate an existing configured navigation button.

## Checks

Verify source hierarchy; old generated-header repair; custom Header preservation; template/new/reopen/default deletion behavior; popup binding and SKU preservation; nine-position styles; browser rendering and navigation action; build; release and affected production path.

## Local Result

- NAV-01 implemented: ordinary Stack navigation composition; matching previous generated Headers repaired once with stable child/action/modal IDs. Genuine custom Headers remain fixed. Overlay alignment exposes nine positions and maps independently to grid vertical/horizontal alignment; legacy stretch and state/style copying remain supported.
- NAV-02 implemented: Blue hero contains navigation Stack > Back Button > editable white arrow Icon, inset 16 design pixels at upper left. It does not add a blank header or increase hero height. Existing configured navigation is retained and an intentionally deleted versioned default is not re-created.
- Automated result: 380 passed, 0 failed, 0 skipped; build 3.26s. JS index-4WLCT3fy.js, CSS index-KpQ6Ek7Z.css.
- Actual local browser: Blue has zero fixed Header layers and a Stack navigation row; all images loaded; Back bounds inside hero; measured inset equals 16 design pixels after canvas scaling; Left/Right top controls change independent grid alignment; the initial-screen Back closes the preview and returning to edit works.
- First full test run had one order-dependent assertion; updated it to find the new modal by ID rather than assuming it is last after Back is correctly inserted at the start. Empty modal, ownership and persistence checks retained.
- Production release/readback is tracked separately; these are not production-runtime claims.
